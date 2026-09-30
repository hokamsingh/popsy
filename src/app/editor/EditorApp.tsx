"use client";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { fromPuck, toPuck, type PuckData } from "@/editor/adapters/puck";
import { puckConfig } from "@/editor/puck/config";
import { loadPopup, savePopup } from "@/editor/storage";
import { parsePopup } from "@/schema/popup";
import { BENCHMARKS } from "@/templates/benchmarks";

const SAVE_DELAY_MS = 500;

const VIEWPORTS = [
  { width: 1100, height: "auto" as const, label: "Desktop" },
  { width: 900, height: "auto" as const, label: "Tablet" },
  { width: 420, height: "auto" as const, label: "Mobile" },
];

interface HeaderToolsProps {
  data: PuckData;
  onLoad: (data: PuckData) => void;
  errors: string[];
  savedAt: string;
  children: ReactNode;
}

function HeaderTools({ data, onLoad, errors, savedAt, children }: HeaderToolsProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  function exportJson() {
    const result = fromPuck(data);
    if (!result.success) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.data.meta?.name || "popup"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const result = parsePopup(JSON.parse(await file.text()));
      if (result.success) onLoad(toPuck(result.data));
      else alert(result.errors.map((e) => `${e.path}: ${e.message}`).join("\n"));
    } catch {
      alert("That file is not valid JSON.");
    }
  }

  return (
    <>
      <span className={`status${errors.length ? " error" : ""}`} title={errors.join("\n")}>
        {errors.length ? `${errors.length} validation issue(s), not saved` : savedAt && `Saved ${savedAt}`}
      </span>
      <select aria-label="Load benchmark" value="" onChange={(e) => e.target.value && onLoad(toPuck(BENCHMARKS[e.target.value]()))}>
        <option value="">Load benchmark…</option>
        {Object.keys(BENCHMARKS).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <button type="button" onClick={exportJson}>
        Export JSON
      </button>
      <button type="button" onClick={() => fileInput.current?.click()}>
        Import JSON
      </button>
      <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
      <Link href="/preview" target="_blank">
        Preview ↗
      </Link>
      {children}
    </>
  );
}

export default function EditorApp() {
  const [data, setData] = useState<PuckData>(() => toPuck(loadPopup()));
  const [savedAt, setSavedAt] = useState("");
  const [loadCount, setLoadCount] = useState(0);

  function loadDocument(next: PuckData) {
    setData(next);
    setLoadCount((count) => count + 1);
  }

  const validation = useMemo(() => fromPuck(data), [data]);
  const errors = useMemo(
    () => (validation.success ? [] : validation.errors.map((e) => `${e.path}: ${e.message}`)),
    [validation],
  );

  useEffect(() => {
    if (!validation.success) return;
    const timer = setTimeout(() => {
      savePopup(validation.data);
      setSavedAt(new Date().toLocaleTimeString());
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [validation]);

  const overrides = useMemo(
    () => ({
      headerActions: ({ children }: { children: ReactNode }) => (
        <HeaderTools data={data} onLoad={loadDocument} errors={errors} savedAt={savedAt}>
          {children}
        </HeaderTools>
      ),
    }),
    [data, errors, savedAt],
  );

  return (
    <Puck
      key={loadCount}
      config={puckConfig}
      data={data}
      viewports={VIEWPORTS}
      onChange={setData}
      overrides={overrides}
    />
  );
}
