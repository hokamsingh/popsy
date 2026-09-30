"use client";
import type { CustomField, Field } from "@puckeditor/core";
import type { CSSProperties, ReactNode } from "react";
import { BREAKPOINTS, expandResponsive, type Breakpoint, type Responsive } from "@/design-system/responsive";
import type { Action, ActionType } from "@/schema/actions";
import { ICON_NAMES } from "@/schema/components";

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  border: "1px solid #d4d4d8",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
};

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 1fr",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  color: "#71717a",
};

const bpLabel = (bp: Breakpoint) => bp[0].toUpperCase() + bp.slice(1);

function BreakpointRows({ render }: { render: (bp: Breakpoint) => ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {BREAKPOINTS.map((bp) => (
        <label key={bp} style={rowStyle}>
          {bpLabel(bp)}
          {render(bp)}
        </label>
      ))}
    </div>
  );
}

interface ResponsiveFieldOptions {
  options?: readonly string[];
  placeholder?: string;
}

function responsiveControl<T extends string | boolean>(
  label: string,
  opts: ResponsiveFieldOptions,
  parse: (raw: string) => T,
  format: (value: T) => string,
): CustomField<Responsive<T> | undefined> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange, id, readOnly }) => {
      const current = expandResponsive(value);
      const set = (bp: Breakpoint, raw: string) => {
        const next = { ...current };
        if (raw === "") delete next[bp];
        else next[bp] = parse(raw);
        onChange(next);
      };
      return (
        <div id={id}>
          <BreakpointRows
            render={(bp) => {
              const shown = current[bp] === undefined ? "" : format(current[bp] as T);
              return opts.options ? (
                <select disabled={readOnly} style={inputStyle} value={shown} onChange={(e) => set(bp, e.target.value)}>
                  <option value="">{bp === "desktop" ? "—" : "inherit"}</option>
                  {opts.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  disabled={readOnly}
                  style={inputStyle}
                  value={shown}
                  placeholder={bp === "desktop" ? (opts.placeholder ?? "e.g. 16px") : "inherit"}
                  onChange={(e) => set(bp, e.target.value)}
                />
              );
            }}
          />
        </div>
      );
    },
  };
}

const identity = (s: string) => s;

export const responsiveField = (label: string, opts: ResponsiveFieldOptions = {}) =>
  responsiveControl<string>(label, opts, identity, identity);

export const responsiveToggle = (label: string) =>
  responsiveControl<boolean>(label, { options: ["yes", "no"] }, (raw) => raw === "yes", (v) => (v ? "yes" : "no"));

export const boolField = (label: string): Field => ({
  type: "radio",
  label,
  options: [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ],
});

export const selectField = (label: string, values: readonly string[], allowEmpty = false): Field => ({
  type: "select",
  label,
  options: [...(allowEmpty ? [{ label: "—", value: "" }] : []), ...values.map((v) => ({ label: v, value: v }))],
});

export const iconField = (label = "Icon"): Field => selectField(label, ICON_NAMES, true);

type ActionChoice = ActionType | "none";

const ACTION_CHOICES: Record<ActionChoice, { label: string; initial: Action | undefined }> = {
  none: { label: "None", initial: undefined },
  dismiss: { label: "Dismiss popup", initial: { type: "dismiss" } },
  navigate: { label: "Navigate (in-app)", initial: { type: "navigate", to: "/" } },
  external_url: { label: "Open URL", initial: { type: "external_url", url: "https://", newTab: true } },
  event: { label: "Emit event", initial: { type: "event", name: "continue" } },
};

export function actionField(label = "Action"): CustomField<Action | undefined> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange, id, readOnly }) => {
      const text = (current: string, update: (v: string) => Action, placeholder?: string) => (
        <input disabled={readOnly} style={inputStyle} value={current} placeholder={placeholder} onChange={(e) => onChange(update(e.target.value))} />
      );
      return (
        <div id={id} style={{ display: "grid", gap: 6 }}>
          <select
            disabled={readOnly}
            style={inputStyle}
            value={value?.type ?? "none"}
            onChange={(e) => onChange(ACTION_CHOICES[e.target.value as ActionChoice].initial)}
          >
            {(Object.entries(ACTION_CHOICES) as [ActionChoice, { label: string }][]).map(([key, { label: text }]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
          {value?.type === "navigate" && text(value.to, (to) => ({ ...value, to }))}
          {value?.type === "external_url" && (
            <>
              {text(value.url, (url) => ({ ...value, url }))}
              <label style={{ fontSize: 12 }}>
                <input type="checkbox" checked={value.newTab ?? true} onChange={(e) => onChange({ ...value, newTab: e.target.checked })} /> Open in new tab
              </label>
            </>
          )}
          {value?.type === "event" && text(value.name, (name) => ({ ...value, name }), "event_name")}
        </div>
      );
    },
  };
}
