"use client";
import type { CustomField, Field } from "@puckeditor/core";
import type { Action } from "@/schema/actions";
import { ICON_NAMES } from "@/schema/components";

const BPS = [
  ["desktop", "Desktop"],
  ["tablet", "Tablet"],
  ["mobile", "Mobile"],
] as const;

type Bp = (typeof BPS)[number][0];
type RValue = string | Partial<Record<Bp, string>> | undefined;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  border: "1px solid #d4d4d8",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
} as const;

const asObject = (v: RValue): Partial<Record<Bp, string>> =>
  v === undefined || v === "" ? {} : typeof v === "string" ? { desktop: v } : v;

/**
 * A field whose value is either a plain value or per-breakpoint overrides.
 * Tablet and mobile inherit from desktop when left empty.
 */
export function responsiveField(label: string, opts: { options?: string[]; placeholder?: string } = {}): CustomField<RValue> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange, id, readOnly }) => {
      const obj = asObject(value);
      const set = (bp: Bp, v: string) => onChange({ ...obj, [bp]: v });
      return (
        <div id={id} style={{ display: "grid", gap: 4 }}>
          {BPS.map(([bp, name]) => (
            <label key={bp} style={{ display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center", gap: 6, fontSize: 11, color: "#71717a" }}>
              {name}
              {opts.options ? (
                <select disabled={readOnly} style={inputStyle} value={obj[bp] ?? ""} onChange={(e) => set(bp, e.target.value)}>
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
                  value={obj[bp] ?? ""}
                  placeholder={bp === "desktop" ? opts.placeholder ?? "e.g. 16px" : "inherit"}
                  onChange={(e) => set(bp, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      );
    },
  };
}

/** Responsive boolean: stored as true/false per breakpoint ("hidden", "wrap"). */
export function responsiveToggle(label: string): CustomField<unknown> {
  type V = boolean | Partial<Record<Bp, boolean>> | undefined;
  return {
    type: "custom",
    label,
    render: ({ value, onChange, id, readOnly }) => {
      const v = value as V;
      const obj: Partial<Record<Bp, boolean>> = v === undefined ? {} : typeof v === "boolean" ? { desktop: v } : v;
      return (
        <div id={id} style={{ display: "grid", gap: 4 }}>
          {BPS.map(([bp, name]) => (
            <label key={bp} style={{ display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center", gap: 6, fontSize: 11, color: "#71717a" }}>
              {name}
              <select
                disabled={readOnly}
                style={inputStyle}
                value={obj[bp] === undefined ? "" : String(obj[bp])}
                onChange={(e) => {
                  const next = { ...obj };
                  if (e.target.value === "") delete next[bp];
                  else next[bp] = e.target.value === "true";
                  onChange(next);
                }}
              >
                <option value="">{bp === "desktop" ? "—" : "inherit"}</option>
                <option value="true">yes</option>
                <option value="false">no</option>
              </select>
            </label>
          ))}
        </div>
      );
    },
  };
}

export const boolField = (label: string): Field => ({
  type: "radio",
  label,
  options: [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ],
});

export const selectField = (label: string, values: string[], allowEmpty = false): Field => ({
  type: "select",
  label,
  options: [...(allowEmpty ? [{ label: "—", value: "" }] : []), ...values.map((v) => ({ label: v, value: v }))],
});

export const iconField = (label = "Icon"): Field => selectField(label, [...ICON_NAMES], true);

type ActionValue = Action | undefined;

const ACTION_LABELS: Record<string, string> = {
  none: "None",
  dismiss: "Dismiss popup",
  navigate: "Navigate (in-app)",
  external_url: "Open URL",
  event: "Emit event",
};

/** Edits the abstract action a Button/Image emits. Business meaning lives in the host app. */
export function actionField(label = "Action"): CustomField<ActionValue> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange, id, readOnly }) => {
      const type = value?.type ?? "none";
      const change = (t: string) => {
        if (t === "none") return onChange(undefined);
        if (t === "dismiss") return onChange({ type: "dismiss" });
        if (t === "navigate") return onChange({ type: "navigate", to: "/" });
        if (t === "external_url") return onChange({ type: "external_url", url: "https://", newTab: true });
        onChange({ type: "event", name: "continue" });
      };
      return (
        <div id={id} style={{ display: "grid", gap: 6 }}>
          <select disabled={readOnly} style={inputStyle} value={type} onChange={(e) => change(e.target.value)}>
            {Object.entries(ACTION_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          {value?.type === "navigate" && (
            <input disabled={readOnly} style={inputStyle} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
          )}
          {value?.type === "external_url" && (
            <>
              <input disabled={readOnly} style={inputStyle} value={value.url} onChange={(e) => onChange({ ...value, url: e.target.value })} />
              <label style={{ fontSize: 12 }}>
                <input type="checkbox" checked={value.newTab ?? true} onChange={(e) => onChange({ ...value, newTab: e.target.checked })} /> Open in new tab
              </label>
            </>
          )}
          {value?.type === "event" && (
            <input disabled={readOnly} style={inputStyle} value={value.name} placeholder="event_name" onChange={(e) => onChange({ ...value, name: e.target.value })} />
          )}
        </div>
      );
    },
  };
}
