import { COMPONENTS, COMPONENT_MAP } from "@/schema/components";
import {
  CURRENT_VERSION,
  parsePopup,
  settingsSchema,
  type ParseResult,
  type Popup,
  type PopupNode,
} from "@/schema/popup";

/**
 * Editor adapter: the ONLY module that knows Puck's serialized shape.
 * The canonical popup schema is the source of truth; Puck data is derived and disposable.
 */

export interface PuckItem {
  type: string;
  props: { id: string; [key: string]: unknown };
}
export interface PuckData {
  root: { props?: Record<string, unknown> };
  content: PuckItem[];
  zones?: Record<string, PuckItem[]>;
}

/** canonical "richtext" ↔ Puck component key "RichText" */
export const toPuckType = (type: string) =>
  COMPONENT_MAP[type]?.label.replace(/\s+/g, "") ?? type;
const FROM_PUCK_TYPE: Record<string, string> = Object.fromEntries(
  COMPONENTS.map((c) => [c.label.replace(/\s+/g, ""), c.type]),
);

const SETTINGS_KEYS = Object.keys(settingsSchema.shape);
/** Props where an empty string is a legitimate value rather than "unset". */
const KEEP_EMPTY = new Set(["content", "alt", "text", "label"]);

export function nodeToPuck(node: PopupNode): PuckItem {
  const def = COMPONENT_MAP[node.type];
  const props: PuckItem["props"] = { id: node.id, ...node.props, style: node.style ?? {} };
  if (def?.container) props.children = (node.children ?? []).map(nodeToPuck);
  return { type: toPuckType(node.type), props };
}

export function toPuck(popup: Popup): PuckData {
  return {
    root: { props: { ...popup.settings, name: popup.meta?.name ?? "" } },
    content: popup.children.map(nodeToPuck),
  };
}

/** Drops unset values the editor leaves behind ("" / undefined / empty objects). */
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
    // Collapse `{desktop: x}` to `x`: responsive objects with one base value are plain values.
    if (keys.length === 1 && keys[0] === "desktop") return out.desktop;
    return out;
  }
  return value;
}

export function nodeFromPuck(item: PuckItem): PopupNode {
  const type = FROM_PUCK_TYPE[item.type] ?? item.type;
  const { id, style, children, ...rest } = item.props;
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (k === "puck" || k === "editMode") continue;
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

/** Converts editor state back to a validated canonical popup. */
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
    children: (data.content ?? []).map(nodeFromPuck),
  });
}
