"use client";
import { usePuck, type CustomField } from "@puckeditor/core";
import { X } from "lucide-react";
import { useRef, useState, type ReactElement } from "react";
import type { Size } from "@/design-system/layers";
import type { Responsive } from "@/design-system/responsive";
import type { Style } from "@/design-system/styles";
import type { Action, ActionType } from "@/schema/actions";
import type { PopupVariable } from "@/schema/popup";
import { ICON_NAMES } from "@/schema/components";
import { ChoiceControl, type Choice } from "../controls/ChoiceControl";
import { ColorControl } from "../controls/ColorControl";
import { FieldShell } from "../controls/FieldShell";
import { FontControl } from "../controls/FontControl";
import { LengthControl, type SliderRange } from "../controls/LengthControl";
import { NumberStepper } from "../controls/NumberStepper";
import { PerDevice } from "../controls/PerDevice";
import { RadiusControl } from "../controls/RadiusControl";
import { SizeControl } from "../controls/SizeControl";
import { StyleEditor } from "../controls/StyleEditor";
import { ToggleControl } from "../controls/ToggleControl";
import { VariablePicker, VariablesControl } from "../controls/VariablesControl";
import { formatBlur, isoToLocalInput, localInputToIso, parseBlur, parseLength, type LengthUnit } from "../controls/values";
import { putBadgeOnBlock } from "./overlay";
import { APP_ACTIONS } from "../appActions";
import styles from "../controls/controls.module.css";

type Change<T> = (value: T | undefined) => void;

function field<T>(label: string, render: (value: T | undefined, onChange: Change<T>) => ReactElement): CustomField<T | undefined> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => render(value, onChange as Change<T>),
  };
}

const firstDevice = <T,>(value: Responsive<T> | undefined): T | undefined =>
  value !== null && typeof value === "object" ? (value as Partial<Record<"desktop", T>>).desktop : value;

interface LengthFieldOptions {
  hint?: string;
  slider?: SliderRange;
  units?: readonly LengthUnit[];
  perDevice?: boolean;
}

export const lengthField = (label: string, { hint, slider, units, perDevice = false }: LengthFieldOptions = {}) =>
  field<Responsive<string>>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      {perDevice ? (
        <PerDevice value={value} onChange={onChange}>
          {(device) => <LengthControl label={label} slider={slider} units={units} {...device} />}
        </PerDevice>
      ) : (
        <LengthControl label={label} slider={slider} units={units} value={firstDevice(value)} onChange={onChange} />
      )}
    </FieldShell>
  ));

interface NumberFieldOptions {
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  perDevice?: boolean;
}

export const numberField = (label: string, { hint, min, max, step, perDevice = false }: NumberFieldOptions = {}) =>
  field<Responsive<string>>(label, (value, onChange) => {
    const control = (current: string | undefined, set: Change<string>, inherited?: string) => {
      const isNumeric = current === undefined || !Number.isNaN(Number(current));
      return isNumeric ? (
        <NumberStepper
          label={label}
          value={current === undefined ? undefined : Number(current)}
          placeholder={inherited}
          min={min}
          max={max}
          step={step}
          onChange={(next) => set(next === undefined ? undefined : String(next))}
        />
      ) : (
        <input className={styles.text} aria-label={label} value={current} onChange={(event) => set(event.target.value || undefined)} />
      );
    };
    return (
      <FieldShell label={label} hint={hint}>
        {perDevice ? (
          <PerDevice value={value} onChange={onChange}>
            {({ value: own, inherited, onChange: set }) => control(own, set, inherited)}
          </PerDevice>
        ) : (
          control(firstDevice(value), onChange)
        )}
      </FieldShell>
    );
  });

export const colorField = (label: string, hint?: string) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      <ColorControl label={label} value={value} onChange={onChange} />
    </FieldShell>
  ));

interface ChoiceFieldOptions {
  hint?: string;
  unsetLabel?: string;
  perDevice?: boolean;
}

export const choiceField = <T extends string>(label: string, choices: readonly Choice<T>[], { hint, unsetLabel, perDevice = false }: ChoiceFieldOptions = {}) =>
  field<Responsive<T>>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      {perDevice ? (
        <PerDevice value={value} onChange={onChange}>
          {(device) => <ChoiceControl label={label} choices={choices} unsetLabel={unsetLabel} {...device} />}
        </PerDevice>
      ) : (
        <ChoiceControl label={label} choices={choices} unsetLabel={unsetLabel} value={firstDevice(value)} onChange={onChange} />
      )}
    </FieldShell>
  ));

export const toggleField = (label: string, hint?: string) =>
  field<Responsive<boolean>>(label, (value, onChange) => (
    <ToggleControl label={label} hint={hint} checked={firstDevice(value) === true} onChange={onChange} />
  ));

interface TextFieldOptions {
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  /** Offer the popup's variables to insert as `{{name}}`. */
  variables?: boolean;
}

function useDeclaredVariables(): PopupVariable[] {
  const { appState } = usePuck();
  return ((appState.data.root.props?.variables as PopupVariable[] | undefined) ?? []).filter((v) => v.name);
}

const isList = (v: PopupVariable) => Array.isArray(v.sample);

/** The repeater the selected block sits in (at any depth), if any. */
function useEnclosingRepeater(): { source?: string } | null {
  const { selectedItem, getParentById } = usePuck();
  let parent = selectedItem ? getParentById(selectedItem.props.id) : undefined;
  while (parent) {
    if (parent.type === "Repeater") return parent.props as { source?: string };
    parent = getParentById(parent.props.id);
  }
  return null;
}

/** Names offered by "Insert a variable": plain variables, plus the item's fields inside a repeater. */
function useInsertableVariableNames(): string[] {
  const declared = useDeclaredVariables();
  const repeater = useEnclosingRepeater();
  const names = declared.filter((v) => !isList(v)).map((v) => v.name);
  if (!repeater) return names;
  const first = declared.find((v) => v.name === (repeater.source ?? "items"))?.sample?.[0];
  const fields = first && typeof first === "object" && !Array.isArray(first) ? Object.keys(first).map((k) => `item.${k}`) : [];
  return [...fields, "index", ...names];
}

interface TextInputProps {
  label: string;
  placeholder?: string;
  multiline?: boolean;
  value: string | undefined;
  onChange: Change<string>;
}

function TextInput({ label, placeholder, multiline, value, onChange }: TextInputProps) {
  return multiline ? (
    <textarea className={styles.text} rows={4} aria-label={label} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
  ) : (
    <input className={styles.text} aria-label={label} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)} />
  );
}

function TextWithVariables({ label, placeholder, multiline, value, onChange }: TextInputProps) {
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const names = useInsertableVariableNames();
  const props = { className: styles.text, "aria-label": label, placeholder, value: value ?? "", ref: input };
  return (
    <>
      {multiline ? (
        <textarea {...props} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...props} onChange={(event) => onChange(event.target.value || undefined)} />
      )}
      <VariablePicker names={names} target={input} value={value ?? ""} onChange={onChange} />
    </>
  );
}

export const textField = (label: string, { hint, placeholder, multiline, variables }: TextFieldOptions = {}) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      {variables ? (
        <TextWithVariables label={label} placeholder={placeholder} multiline={multiline} value={value} onChange={onChange} />
      ) : (
        <TextInput label={label} placeholder={placeholder} multiline={multiline} value={value} onChange={onChange} />
      )}
    </FieldShell>
  ));

function ListVariablePicker({ label, value, onChange }: { label: string; value: string | undefined; onChange: Change<string> }) {
  const lists = useDeclaredVariables().filter(isList);
  if (!lists.length) {
    return <p className={styles.hint}>Add a list variable under Variables first (choose “List” and paste sample items).</p>;
  }
  return (
    <select className={styles.select} aria-label={label} value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)}>
      {!lists.some((v) => v.name === value) && <option value={value ?? ""}>{value ? `${value} (not in Variables)` : "Choose a list…"}</option>}
      {lists.map((v) => (
        <option key={v.name} value={v.name}>
          {`${v.name} (${v.sample?.length ?? 0} sample items)`}
        </option>
      ))}
    </select>
  );
}

export const listVariableField = (label: string, hint?: string) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      <ListVariablePicker label={label} value={value} onChange={onChange} />
    </FieldShell>
  ));

export const variablesField = () =>
  field<PopupVariable[]>("Variables", (value, onChange) => (
    <FieldShell
      label="Variables"
      hint="Write {{name}} in any text, or {{name|fallback}}. Your website can send the real value; otherwise the default shows (and that's what you see here). A List holds items for a Repeater."
    >
      <VariablesControl value={value} onChange={onChange} />
    </FieldShell>
  ));

export const popupHeightField = (label: string, slider: SliderRange) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label}>
      <SizeControl label={label} value={value} onChange={onChange} slider={slider} autoLabel="Fit the content" fixedLabel="Set a height" startingSize="400px" />
    </FieldShell>
  ));

export const dateTimeField = (label: string, hint?: string) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      <input
        type="datetime-local"
        className={styles.text}
        aria-label={label}
        value={isoToLocalInput(value)}
        onChange={(event) => onChange(localInputToIso(event.target.value))}
      />
    </FieldShell>
  ));

function LayerOnTopButton() {
  const { selectedItem, getSelectorForId, dispatch } = usePuck();

  const addBadge = () => {
    const selector = selectedItem ? getSelectorForId(selectedItem.props.id) : undefined;
    if (!selectedItem || !selector) return;
    const layers = putBadgeOnBlock(selectedItem);
    dispatch({
      type: "replace",
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: layers,
      ui: { itemSelector: { index: 1, zone: `${layers.props.id}:children` } },
    });
  };

  return (
    <FieldShell label="Put something on top of this block" hint="Wraps this block in a layer and adds a “New” badge in its top-left corner. Then change the badge's text and spot, or drop more blocks into the layer.">
      <button type="button" className={styles.presetButton} onClick={addBadge}>
        Add a badge on top
      </button>
    </FieldShell>
  );
}

export const layerOnTopField = () => field<never>("Put something on top", () => <LayerOnTopButton />);

export const fontField = (label: string, hint?: string) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      <FontControl label={label} value={value} onChange={onChange} storeAs="reference" unsetLabel="Use the popup's font" />
    </FieldShell>
  ));

type Tokens = Record<string, string>;

const THEME_FONTS = [
  { token: "font.heading", label: "Heading font" },
  { token: "font.body", label: "Body font" },
] as const;

export const themeFontsField = () =>
  field<Tokens>("Fonts for the whole popup", (value, onChange) => {
    const tokens = value ?? {};
    const setFont = (token: string, font: string | undefined) => {
      const next = { ...tokens };
      if (font === undefined) delete next[token];
      else next[token] = font;
      onChange(Object.keys(next).length ? next : undefined);
    };
    return (
      <>
        {THEME_FONTS.map(({ token, label }) => (
          <FieldShell key={token} label={label} hint={token === "font.body" ? "Used for everything that isn't a heading." : "Used by headings and subheadings."}>
            <FontControl label={label} value={tokens[token]} onChange={(font) => setFont(token, font)} storeAs="stack" unsetLabel="Default" />
          </FieldShell>
        ))}
      </>
    );
  });

export const radiusField = (label: string) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label}>
      <RadiusControl label={label} value={value} onChange={onChange} />
    </FieldShell>
  ));

export const blurField = (label: string, hint?: string) =>
  field<string>(label, (value, onChange) => {
    const amount = parseBlur(value);
    return (
      <FieldShell label={`${label}: ${amount}px`} hint={hint}>
        <input type="range" className={styles.slider} aria-label={label} min={0} max={30} value={amount} onChange={(event) => onChange(formatBlur(Number(event.target.value), value))} />
      </FieldShell>
    );
  });

export const iconField = (label = "Icon", { required = false }: { required?: boolean } = {}) => {
  const choices: Choice<string>[] = ICON_NAMES.map((name) => ({ value: name, label: name.replace(/-/g, " ") }));
  return field<string>(label, (value, onChange) => (
    <FieldShell label={label}>
      <ChoiceControl label={label} choices={choices} value={value} onChange={onChange} unsetLabel={required ? undefined : "No icon"} />
    </FieldShell>
  ));
};

const lengthInPixels = (value: unknown, fallback: number) => {
  const text = typeof value === "string" ? value : (value as { desktop?: string } | undefined)?.desktop;
  const length = parseLength(text);
  return length?.unit === "px" ? length.amount : fallback;
};

function useSelectedLayerSize(): Size | null {
  const { appState, selectedItem, getParentById } = usePuck();
  const parent = selectedItem ? getParentById(selectedItem.props.id) : undefined;
  if (parent?.type !== "Layers") return null;
  return {
    width: lengthInPixels(appState.data.root.props?.width, 420),
    height: lengthInPixels(parent.props.height, 320),
  };
}

function StyleFieldEditor({ value, onChange }: { value: Style | undefined; onChange: Change<Style> }) {
  return <StyleEditor value={value} onChange={onChange} layer={useSelectedLayerSize()} />;
}

export const styleField = () => field<Style>("Style", (value, onChange) => <StyleFieldEditor value={value} onChange={onChange} />);

type ActionChoice = ActionType | "none";

const ACTION_CHOICES: Record<ActionChoice, { label: string; initial: Action | undefined }> = {
  none: { label: "Do nothing", initial: undefined },
  dismiss: { label: "Close the popup", initial: { type: "dismiss" } },
  navigate: { label: "Go to a page on your site", initial: { type: "navigate", to: "/" } },
  external_url: { label: "Open a web address", initial: { type: "external_url", url: "https://", newTab: true } },
  event: { label: "Tell your app (custom signal)", initial: { type: "event", name: "continue" } },
};

type AppEventAction = Extract<Action, { type: "event" }>;
type PayloadRow = [key: string, value: string];

const SUCCESS_CHOICES: Choice<string>[] = [
  { value: "stay", label: "Keep the popup open" },
  { value: "close", label: "Close the popup" },
];

const toRows = (payload: Record<string, unknown> | undefined): PayloadRow[] =>
  Object.entries(payload ?? {}).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]);

/** Settings for "Tell your app": which action, the data sent with it, and what the button does with the answer. */
function AppActionEditor({ value, onChange }: { value: AppEventAction; onChange: Change<Action> }) {
  const [rows, setRows] = useState<PayloadRow[]>(() => toRows(value.payload));
  const known = APP_ACTIONS.find((a) => a.name === value.name);
  const update = (patch: Partial<AppEventAction>) => onChange({ ...value, ...patch });
  const setPayload = (next: PayloadRow[]) => {
    setRows(next);
    const filled = next.filter(([key]) => key.trim());
    update({ payload: filled.length ? Object.fromEntries(filled) : undefined });
  };
  const chooseAction = (name: string) => {
    const action = APP_ACTIONS.find((a) => a.name === name);
    const existing = new Map(rows);
    const next: PayloadRow[] = action ? action.fields.map((field) => [field, existing.get(field) ?? ""]) : rows;
    setRows(next);
    const filled = next.filter(([key]) => key.trim());
    update({ name, payload: filled.length ? Object.fromEntries(filled) : undefined });
  };

  return (
    <>
      {APP_ACTIONS.length ? (
        <select className={styles.select} aria-label="App action" value={known ? value.name : ""} onChange={(event) => event.target.value && chooseAction(event.target.value)}>
          {!known && <option value="">{value.name ? `${value.name} (custom)` : "Choose an action…"}</option>}
          {APP_ACTIONS.map((a) => (
            <option key={a.name} value={a.name}>
              {a.label}
            </option>
          ))}
        </select>
      ) : null}
      {!known && (
        <input className={styles.text} aria-label="App action name" value={value.name} placeholder="claim_offer" onChange={(event) => update({ name: event.target.value })} />
      )}
      <p className={styles.hint}>A name your developer listens for, such as claim_offer or start_signup.</p>

      <span className={styles.label}>Data sent with it</span>
      {rows.map(([key, val], i) => (
        <div key={i} className={styles.variableRow}>
          <input className={styles.text} aria-label={`Data ${i + 1} name`} placeholder="id" value={key} onChange={(event) => setPayload(rows.map((r, j) => (j === i ? [event.target.value, r[1]] : r)))} />
          <input className={styles.text} aria-label={`Data ${i + 1} value`} placeholder="{{item.id}}" value={val} onChange={(event) => setPayload(rows.map((r, j) => (j === i ? [r[0], event.target.value] : r)))} />
          <button type="button" className={styles.iconButton} aria-label={`Remove ${key || "data"}`} onClick={() => setPayload(rows.filter((_, j) => j !== i))}>
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button type="button" className={styles.linkButton} onClick={() => setRows([...rows, ["", ""]])}>
        + Add data
      </button>
      <p className={styles.hint}>Values can use variables, e.g. {"{{item.id}}"} inside a repeater.</p>

      <span className={styles.label}>When your app says it worked</span>
      <ChoiceControl label="When it worked" choices={SUCCESS_CHOICES} value={value.onSuccess} unsetLabel="Keep the popup open" onChange={(onSuccess) => update({ onSuccess: onSuccess as AppEventAction["onSuccess"] })} />
      <input className={styles.text} aria-label="Message when it worked" placeholder="Message on the button, e.g. Done! (optional)" value={value.successMessage ?? ""} onChange={(event) => update({ successMessage: event.target.value || undefined })} />
      <input className={styles.text} aria-label="Message if it failed" placeholder="If it fails, e.g. Couldn't start, try again" value={value.errorMessage ?? ""} onChange={(event) => update({ errorMessage: event.target.value || undefined })} />
      <p className={styles.hint}>The button shows a spinner while your app works on it.</p>
    </>
  );
}

export const actionField = (label = "When clicked") =>
  field<Action>(label, (value, onChange) => {
    const text = (current: string, update: (next: string) => Action, placeholder?: string) => (
      <input className={styles.text} aria-label={label} value={current} placeholder={placeholder} onChange={(event) => onChange(update(event.target.value))} />
    );
    return (
      <FieldShell label={label}>
        <select
          className={styles.select}
          aria-label={label}
          value={value?.type ?? "none"}
          onChange={(event) => onChange(ACTION_CHOICES[event.target.value as ActionChoice].initial)}
        >
          {(Object.entries(ACTION_CHOICES) as [ActionChoice, { label: string }][]).map(([key, choice]) => (
            <option key={key} value={key}>
              {choice.label}
            </option>
          ))}
        </select>
        {value?.type === "navigate" && text(value.to, (to) => ({ ...value, to }), "/pricing")}
        {value?.type === "external_url" && (
          <>
            {text(value.url, (url) => ({ ...value, url }), "https://example.com")}
            <ToggleControl label="Open in a new tab" checked={value.newTab ?? true} onChange={(newTab) => onChange({ ...value, newTab })} />
          </>
        )}
        {value?.type === "event" && <AppActionEditor value={value} onChange={onChange} />}
      </FieldShell>
    );
  });
