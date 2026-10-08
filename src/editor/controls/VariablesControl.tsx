"use client";
import { X } from "lucide-react";
import { useState, type RefObject } from "react";
import type { PopupVariable } from "@/schema/popup";
import styles from "./controls.module.css";

interface VariablesControlProps {
  value: PopupVariable[] | undefined;
  onChange: (value: PopupVariable[] | undefined) => void;
}

const EXAMPLE_LIST = '[{ "id": 1, "title": "Starter", "price": "$4.99" }]';

/** Sample items for a list variable, typed as JSON; kept as text until it parses. */
function ListSampleInput({ index, sample, onChange }: { index: number; sample: unknown[]; onChange: (sample: unknown[]) => void }) {
  const [text, setText] = useState(() => JSON.stringify(sample, null, 2));
  const [error, setError] = useState("");
  const edit = (next: string) => {
    setText(next);
    try {
      const parsed: unknown = JSON.parse(next);
      if (!Array.isArray(parsed)) throw new Error("not a list");
      setError("");
      onChange(parsed);
    } catch {
      setError("Paste a JSON list, like " + EXAMPLE_LIST);
    }
  };
  return (
    <>
      <textarea className={styles.text} rows={6} aria-label={`Variable ${index + 1} sample items`} value={text} onChange={(event) => edit(event.target.value)} spellCheck={false} />
      <p className={styles.hint}>{error || `${sample.length} sample item(s). Your website sends the real list; these show while you design.`}</p>
    </>
  );
}

/** The popup's list of variables, each with the value shown when the website doesn't send one. */
export function VariablesControl({ value = [], onChange }: VariablesControlProps) {
  const update = (index: number, patch: Partial<PopupVariable>) =>
    onChange(value.map((variable, i) => (i === index ? { ...variable, ...patch } : variable)));
  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next.length ? next : undefined);
  };
  const setKind = (index: number, list: boolean) =>
    onChange(value.map((variable, i) => {
      if (i !== index) return variable;
      const { sample, ...rest } = variable;
      void sample;
      return list ? { ...rest, defaultValue: "", sample: [] } : rest;
    }));

  return (
    <>
      {value.map((variable, i) => {
        const isList = Array.isArray(variable.sample);
        return (
          <div key={i} className={styles.variableBlock}>
            <div className={styles.variableRow}>
              <input
                className={styles.text}
                aria-label={`Variable ${i + 1} name`}
                placeholder={isList ? "items" : "firstName"}
                value={variable.name}
                onChange={(event) => update(i, { name: event.target.value.replace(/[^A-Za-z0-9_.]/g, "") })}
              />
              <select className={styles.select} aria-label={`Variable ${i + 1} kind`} value={isList ? "list" : "text"} onChange={(event) => setKind(i, event.target.value === "list")}>
                <option value="text">Text</option>
                <option value="list">List</option>
              </select>
              <button type="button" className={styles.iconButton} aria-label={`Remove ${variable.name || "variable"}`} onClick={() => remove(i)}>
                <X size={14} aria-hidden />
              </button>
            </div>
            {isList ? (
              <ListSampleInput index={i} sample={variable.sample ?? []} onChange={(sample) => update(i, { sample })} />
            ) : (
              <input
                className={styles.text}
                aria-label={`Variable ${i + 1} default value`}
                placeholder="Default value"
                value={variable.defaultValue ?? ""}
                onChange={(event) => update(i, { defaultValue: event.target.value })}
              />
            )}
          </div>
        );
      })}
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
