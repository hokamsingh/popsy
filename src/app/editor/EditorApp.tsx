"use client";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { fromPuck, toPuck, type PuckData } from "@/editor/adapters/puck";
import { puckConfig } from "@/editor/puck/config";
import { loadPopup, savePopup } from "@/editor/storage";
import { BENCHMARKS } from "@/templates/benchmarks";
import { parsePopup, type ValidationIssue } from "@/schema/popup";

const VIEWPORTS = [
  { width: 1100, height: "auto" as const, label: "Desktop" },
  { width: 900, height: "auto" as const, label: "Tablet" },
  { width: 420, height: "auto" as const, label: "Mobile" },
];

export default function EditorApp() {
  const initial = useMemo(() => toPuck(loadPopup()) as unknown as Data, []);
  const [data, setData] = useState<Data>(initial);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [savedAt, setSavedAt] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  /** Persist the canonical document (never Puck's shape); surface validation problems. */
  const persist = useCallback((next: Data) => {
    const result = fromPuck(next as unknown as PuckData);
    if (result.success) {
      savePopup(result.data);
      setIssues([]);
      setSavedAt(new Date().toLocaleTimeString());
    } else {
      setIssues(result.errors);
    }
  }, []);

  const exportJson = () => {
    const result = fromPuck(data as unknown as PuckData);
    if (!result.success) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.data.meta?.name || "popup"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const result = parsePopup(JSON.parse(await file.text()));
      if (!result.success) return setIssues(result.errors);
      const next = toPuck(result.data) as unknown as Data;
      setData(next);
      persist(next);
    } catch {
      setIssues([{ path: "", message: "file is not valid JSON" }]);
    }
  };

  const loadFixture = (id: string) => {
    if (!id) return;
    const next = toPuck(BENCHMARKS[id]()) as unknown as Data;
    setData(next);
    persist(next);
  };

  return (
    <Puck
      config={puckConfig}
      data={data}
      viewports={VIEWPORTS}
      onChange={(next) => {
        setData(next);
        persist(next);
      }}
      onPublish={persist}
      overrides={{
        headerActions: ({ children }) => (
          <>
            <span className={`status${issues.length ? " error" : ""}`} title={issues.map((i) => `${i.path}: ${i.message}`).join("\n")}>
              {issues.length ? `${issues.length} validation issue(s) — not saved` : savedAt ? `Saved ${savedAt}` : ""}
            </span>
            <select aria-label="Load benchmark" value="" onChange={(e) => loadFixture(e.target.value)}>
              <option value="">Load benchmark…</option>
              {Object.keys(BENCHMARKS).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <button type="button" onClick={exportJson}>Export JSON</button>
            <button type="button" onClick={() => fileRef.current?.click()}>Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            <Link href="/preview" target="_blank" style={{ fontSize: 13 }}>Preview ↗</Link>
            {children}
          </>
        ),
      }}
    />
  );
}
