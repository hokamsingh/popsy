"use client";
import { createContext, useContext } from "react";
import type { Action } from "@/schema/actions";
import { createTemplater, type Templater } from "./variables";

export interface RuntimeContextValue {
  run: (action: Action | undefined) => void;
  editing: boolean;
  /** Keeps CSS class names unique when several popups share one page. */
  scope: string;
  /** Fills `{{variables}}` into text and URLs. */
  vars: Templater;
}

export const RuntimeContext = createContext<RuntimeContextValue>({ run: () => {}, editing: false, scope: "", vars: createTemplater() });
export const useRuntime = () => useContext(RuntimeContext);
