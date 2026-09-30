"use client";
import { createContext, useContext } from "react";
import type { Action } from "@/schema/actions";

export interface RuntimeContextValue {
  run: (action: Action | undefined) => void;
  /** True inside the editor canvas, where actions must not fire. */
  editing: boolean;
}

export const RuntimeContext = createContext<RuntimeContextValue>({ run: () => {}, editing: false });
export const useRuntime = () => useContext(RuntimeContext);
