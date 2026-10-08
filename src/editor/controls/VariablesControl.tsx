"use client";
import { X } from "lucide-react";
import type { RefObject } from "react";
import type { PopupVariable } from "@/schema/popup";
import styles from "./controls.module.css";

interface VariablesControlProps {
  value: PopupVariable[] | undefined;
  onChange: (value: PopupVariable[] | undefined) => void;
}

/** The popup's list of variables, each with the value shown when the website doesn't send one. */
export function VariablesControl({ value = [], onChange }: VariablesControlProps) {
  const update = (index: number, patch: Partial<PopupVariable>) =>
    onChange(value.map((variable, i) => (i === index ? { ...variable, ...patch } : variable)));
  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next.length ? next : undefined);
  };

  return (
    <>
      {value.map((variable, i) => (
        <div key={i} className={styles.variableRow}>
          <input
            className={styles.text}
            aria-label={`Variable ${i + 1} name`}
            placeholder="firstName"
            value={variable.name}
            onChange={(event) => update(i, { name: event.target.value.replace(/[^A-Za-z0-9_.]/g, "") })}
          />
          <input
            className={styles.text}
            aria-label={`Variable ${i + 1} default value`}
            placeholder="Default value"
            value={variable.defaultValue ?? ""}
            onChange={(event) => update(i, { defaultValue: event.target.value })}
          />
          <button type="button" className={styles.iconButton} aria-label={`Remove ${variable.name || "variable"}`} onClick={() => remove(i)}>
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button type="button" className={styles.linkButton} onClick={() => onChange([...value, { name: "", defaultValue: "" }])}>
        + Add a variable
      </button>
    </>
  );
}

interface VariablePickerProps {
  names: string[];
  target: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

/** Drops `{{name}}` into a text box at the cursor. */
export function VariablePicker({ names, target, value, onChange }: VariablePickerProps) {
  if (!names.length) return null;

  const insert = (name: string) => {
    const input = target.current;
    const token = `{{${name}}}`;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <select className={styles.select} aria-label="Insert a variable" value="" onChange={(event) => event.target.value && insert(event.target.value)}>
      <option value="">Insert a variable…</option>
      {names.map((name) => (
        <option key={name} value={name}>
          {`{{${name}}}`}
        </option>
      ))}
    </select>
  );
}
