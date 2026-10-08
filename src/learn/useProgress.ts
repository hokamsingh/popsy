"use client";
import { useMemo, useSyncExternalStore } from "react";
import { PROGRESS_EVENT, parseProgress, readProgressText, type Progress } from "./progress";

function subscribe(onChange: () => void) {
  window.addEventListener(PROGRESS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The saved progress, empty while rendering on the server, and kept in step across tabs. */
export function useProgress(): Progress {
  const text = useSyncExternalStore(subscribe, readProgressText, () => "");
  return useMemo(() => parseProgress(text), [text]);
}
