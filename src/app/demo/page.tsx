"use client";
import dynamic from "next/dynamic";

// Client-only: the demo reads the popup saved in this browser by the editor.
const DemoApp = dynamic(() => import("./DemoApp"), { ssr: false, loading: () => <p style={{ padding: 16 }}>Loading demo…</p> });

export default function DemoPage() {
  return <DemoApp />;
}
