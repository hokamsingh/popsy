"use client";
import type { CustomField } from "@puckeditor/core";
import type { ReactElement } from "react";
import type { Responsive } from "@/design-system/responsive";
import type { Style } from "@/design-system/styles";
import type { Action, ActionType } from "@/schema/actions";
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
import { formatBlur, isoToLocalInput, localInputToIso, parseBlur, type LengthUnit } from "../controls/values";
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
}

export const textField = (label: string, { hint, placeholder, multiline }: TextFieldOptions = {}) =>
  field<string>(label, (value, onChange) => (
    <FieldShell label={label} hint={hint}>
      {multiline ? (
        <textarea className={styles.text} rows={4} aria-label={label} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={styles.text} aria-label={label} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)} />
      )}
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

export const styleField = () =>
  field<Style>("Style", (value, onChange) => <StyleEditor value={value} onChange={onChange} />);

type ActionChoice = ActionType | "none";

const ACTION_CHOICES: Record<ActionChoice, { label: string; initial: Action | undefined }> = {
  none: { label: "Do nothing", initial: undefined },
  dismiss: { label: "Close the popup", initial: { type: "dismiss" } },
  navigate: { label: "Go to a page on your site", initial: { type: "navigate", to: "/" } },
  external_url: { label: "Open a web address", initial: { type: "external_url", url: "https://", newTab: true } },
  event: { label: "Tell your app (custom signal)", initial: { type: "event", name: "continue" } },
};

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
        {value?.type === "event" && (
          <>
            {text(value.name, (name) => ({ ...value, name }), "claim_offer")}
            <p className={styles.hint}>A name your developer listens for, such as claim_offer or start_signup.</p>
          </>
        )}
      </FieldShell>
    );
  });
