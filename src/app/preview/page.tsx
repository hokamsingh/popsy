"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useState } from "react";
import { loadPopup } from "@/editor/storage";
import { PopupRenderer } from "@/runtime/renderer";
import { BENCHMARKS } from "@/templates/benchmarks";
import { useSearchParams } from "next/navigation";

function Preview() {
  const params = useSearchParams();
  const fixture = params.get("fixture");
  const popup = useMemo(() => (fixture && BENCHMARKS[fixture] ? BENCHMARKS[fixture]() : loadPopup()), [fixture]);
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((line: string) => setLog((l) => [...l.slice(-3), line]), []);
  const actions = useMemo(
    () => ({
      onEvent: (name: string, payload?: Record<string, unknown>) => note(`event: ${name} ${payload ? JSON.stringify(payload) : ""}`),
      navigate: (to: string) => note(`navigate: ${to}`),
      openUrl: (url: string) => note(`open: ${url}`),
      onError: (m: string) => note(`blocked: ${m}`),
    }),
    [note],
  );
  const onDismiss = useCallback(() => {
    setOpen(false);
    note("dismissed");
  }, [note]);

  return (
    <>
      <div className="bar">
        <strong>Preview{fixture ? ` — ${fixture}` : ""}</strong>
        <button type="button" onClick={() => setOpen(true)}>Open popup</button>
        <Link href="/editor">Editor</Link>
        <Link href="/">Home</Link>
      </div>
      <div className="preview-stage" />
      <PopupRenderer popup={popup} open={open} onDismiss={onDismiss} actions={actions} />
      {log.length > 0 && <div className="log">{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
    </>
  );
}

const ClientPreview = dynamic(() => Promise.resolve(Preview), { ssr: false });

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <ClientPreview />
    </Suspense>
  );
}
