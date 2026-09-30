"use client";
import dynamic from "next/dynamic";

// Puck touches `window`/iframes; the editor is client-only.
const EditorApp = dynamic(() => import("./EditorApp"), { ssr: false, loading: () => <p style={{ padding: 16 }}>Loading editor…</p> });

export default function EditorPage() {
  return <EditorApp />;
}
