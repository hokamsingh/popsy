"use client";
import dynamic from "next/dynamic";

const EditorApp = dynamic(() => import("./EditorApp"), { ssr: false, loading: () => <p style={{ padding: 16 }}>Loading editor…</p> });

export default function EditorPage() {
  return <EditorApp />;
}
