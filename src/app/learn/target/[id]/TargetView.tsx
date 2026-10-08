"use client";
import { PopupRenderer } from "@/runtime/renderer";
import type { Popup } from "@/schema/popup";

/** A challenge's finished popup on its own page, shown in a frame so phone and desktop rules apply for real. */
export default function TargetView({ popup }: { popup: Popup }) {
  return (
    <div style={{ minHeight: "100vh", padding: 12, background: "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px" }}>
      <PopupRenderer popup={popup} mode="inline" editing />
    </div>
  );
}
