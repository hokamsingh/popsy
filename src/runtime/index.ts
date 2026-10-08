/**
 * @popsy-render/runtime: render Popsy popups in any React 18/19 app (Next.js App Router included).
 * The editor is not part of this entry point.
 */
export { PopupRenderer, type PopupRendererProps } from "./renderer";
export { createActionRuntime, type ActionRuntime, type ActionRuntimeOptions, type ActionStatus, type EventHandler } from "./actions";
export { createTemplater, variablesIn, type Templater, type TemplaterOptions, type DeclaredVariable } from "./variables";
export { parsePopup, popupSchema, CURRENT_VERSION, type Popup, type PopupNode, type PopupSettings, type PopupVariable, type ParseResult, type ValidationIssue } from "@/schema/popup";
export type { Action } from "@/schema/actions";
export type { ShellMode } from "@/components/popup/PopupShell";
