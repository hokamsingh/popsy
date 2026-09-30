"use client";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import { Download, Eye, FilePlus, Home, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { fromPuck, toPuck, type PuckData } from "@/editor/adapters/puck";
import { puckConfig } from "@/editor/puck/config";
import { loadPopup, savePopup } from "@/editor/storage";
import { parsePopup } from "@/schema/popup";
import { BENCHMARKS } from "@/templates/benchmarks";
import { createBlankPopup } from "@/templates/blank";

const SAVE_DELAY_MS = 500;
const TOAST_MS = 3500;

interface Toast {
  kind: "success" | "error";
  text: string;
}

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

  function replaceWith(next: PuckData) {
    const ok = window.confirm("This replaces what you're working on now. Export it first if you want to keep it. Continue?");
    if (ok) onLoad(next);
  }

  async function importJson(file: File) {
    try {
      const result = parsePopup(JSON.parse(await file.text()));
      if (result.success) replaceWith(toPuck(result.data));
      else alert(`That file can't be used:\n${result.errors.map((e) => `• ${e.path}: ${e.message}`).join("\n")}`);
    } catch {
      alert("That file isn't a valid popup file.");
    }
  }

  return (
    <>
      <Link href="/" className="tool tool-link" title="Back to home">
        <Home size={15} aria-hidden /> Home
      </Link>
      {errors.length ? (
        <details className="tool-problems">
          <summary className="tool-status is-error">{errors.length} thing(s) to fix, not saved</summary>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </details>
      ) : (
        <span className="tool-status">{savedAt ? `Saved ${savedAt}` : "Not saved yet"}</span>
      )}
      <button type="button" className="tool" onClick={() => replaceWith(toPuck(createBlankPopup()))}>
        <FilePlus size={15} aria-hidden /> New
      </button>
      <select className="tool" aria-label="Load benchmark" value="" onChange={(e) => e.target.value && replaceWith(toPuck(BENCHMARKS[e.target.value]()))}>
        <option value="">Load example…</option>
        {Object.keys(BENCHMARKS).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <button type="button" className="tool" onClick={exportJson}>
        <Download size={15} aria-hidden /> Export
      </button>
      <button type="button" className="tool" onClick={() => fileInput.current?.click()}>
        <Upload size={15} aria-hidden /> Import
      </button>
      <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
      <Link href="/preview" target="_blank" className="tool tool-link">
        <Eye size={15} aria-hidden /> Preview
      </Link>
      {children}
    </>
  );
}

export default function EditorApp() {
  const [data, setData] = useState<PuckData>(() => toPuck(loadPopup()));
  const [savedAt, setSavedAt] = useState("");
  const [loadCount, setLoadCount] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function publish(published: PuckData) {
    const result = fromPuck(published);
    if (!result.success) {
      const first = result.errors[0];
      setToast({ kind: "error", text: `Couldn't publish: ${first.path} ${first.message}` });
      return;
    }
    savePopup(result.data);
    setSavedAt(new Date().toLocaleTimeString());
    setToast({ kind: "success", text: "Published. Your popup is saved and ready in Preview." });
  }

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
    <>
      <Puck
        key={loadCount}
        config={puckConfig}
        data={data}
        viewports={VIEWPORTS}
        onChange={setData}
        onPublish={publish}
        overrides={overrides}
      />
      {toast && (
        <div role="status" className={`toast toast-${toast.kind}`}>
          {toast.text}
        </div>
      )}
    </>
  );
}
