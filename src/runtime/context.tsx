"use client";
import { createContext, useContext } from "react";
import type { Action } from "@/schema/actions";
import type { ActionStatus } from "./actions";
import { createTemplater, type Templater } from "./variables";

export interface RuntimeContextValue {
  /** Fills `{{variables}}` into an action, runs it and reports how it went, so buttons can show progress. */
  run: (action: Action | undefined) => Promise<ActionStatus>;
  /** Runs an action exactly as given. Scopes like a repeater item use it to fill their own values first. */
  perform: (action: Action | undefined) => Promise<ActionStatus>;
  editing: boolean;
  /** Keeps CSS class names unique when several popups share one page. */
  scope: string;
  /** Fills `{{variables}}` into text and URLs. */
  vars: Templater;
}

export const RuntimeContext = createContext<RuntimeContextValue>({ run: async () => "done", perform: async () => "done", editing: false, scope: "", vars: createTemplater() });
export const useRuntime = () => useContext(RuntimeContext);
