import type { ComponentData, Data, DefaultComponents } from "@puckeditor/core";
import { COMPONENTS, COMPONENT_MAP } from "@/schema/components";
import {
  CURRENT_VERSION,
  parsePopup,
  settingsSchema,
  type ParseResult,
  type Popup,
  type PopupNode,
} from "@/schema/popup";

export type PuckItem = ComponentData<Record<string, unknown> & { id: string }>;
export type PuckData = Data<DefaultComponents, Record<string, unknown>>;

const toEditorKey = (type: string) => COMPONENT_MAP[type]?.editorKey ?? type;
const FROM_EDITOR_KEY: Record<string, string> = Object.fromEntries(COMPONENTS.map((c) => [c.editorKey, c.type]));

const SETTINGS_KEYS = Object.keys(settingsSchema.shape);
const KEEP_EMPTY = new Set(["content", "alt", "text", "label"]);

export function nodeToPuck(node: PopupNode): PuckItem {
  const def = COMPONENT_MAP[node.type];
  const props: PuckItem["props"] = { id: node.id, ...node.props, style: node.style ?? {} };
  if (def?.container) props.children = (node.children ?? []).map(nodeToPuck);
  return { type: toEditorKey(node.type), props };
}

export function toPuck(popup: Popup): PuckData {
  return {
    root: { props: { ...popup.settings, name: popup.meta?.name ?? "" } },
    content: popup.children.map(nodeToPuck),
  };
}

function clean(value: unknown, key?: string): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value === "" && !(key && KEEP_EMPTY.has(key)) ? undefined : value;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v, k);
      if (c !== undefined) out[k] = c;
    }
    const keys = Object.keys(out);
    if (!keys.length) return undefined;
    if (keys.length === 1 && keys[0] === "desktop") return out.desktop;
    return out;
  }
  return value;
}

export function nodeFromPuck(item: PuckItem): PopupNode {
  const type = FROM_EDITOR_KEY[item.type] ?? item.type;
  const { id, style, children, ...rest } = item.props;
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    const c = clean(v, k);
    if (c !== undefined) props[k] = c;
  }
  const node: PopupNode = { id, type, props };
  const s = clean(style);
  if (s && typeof s === "object") node.style = s as PopupNode["style"];
  if (COMPONENT_MAP[type]?.container) {
    node.children = Array.isArray(children) ? (children as PuckItem[]).map(nodeFromPuck) : [];
  }
  return node;
}

export function fromPuck(data: PuckData): ParseResult {
  const rootProps = data.root?.props ?? {};
  const settings: Record<string, unknown> = {};
  for (const key of SETTINGS_KEYS) {
    const c = clean(rootProps[key], key);
    if (c !== undefined) settings[key] = c;
  }
  const name = typeof rootProps.name === "string" && rootProps.name ? rootProps.name : undefined;
  return parsePopup({
    version: CURRENT_VERSION,
    type: "popup",
    ...(name ? { meta: { name } } : {}),
    settings,
    children: (data.content ?? []).map((item) => nodeFromPuck(item as PuckItem)),
  });
}
