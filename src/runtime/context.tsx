"use client";
import { createContext, useContext } from "react";
import type { Action } from "@/schema/actions";

export interface RuntimeContextValue {
  run: (action: Action | undefined) => void;
  editing: boolean;
  /** Keeps CSS class names unique when several popups share one page. */
  scope: string;
}

export const RuntimeContext = createContext<RuntimeContextValue>({ run: () => {}, editing: false, scope: "" });
export const useRuntime = () => useContext(RuntimeContext);
