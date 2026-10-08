import { settingsSchema, type Popup, type PopupNode, type PopupSettings } from "@/schema/popup";
import { TEXT_KEYS, textSimilarity, valueSimilarity } from "./similarity";
import type { Objective } from "./types";

const BLOCK_NAMES: Record<string, string> = {
  section: "Section", container: "Container", layers: "Layers", repeater: "Repeater", stack: "Stack",
  flex: "Row", grid: "Grid", spacer: "Space", divider: "Line", text: "Text", richtext: "Rich Text",
  image: "Image", video: "Video", icon: "Icon", button: "Button", badge: "Badge", countdown: "Countdown",
};

export const blockName = (type: string) => BLOCK_NAMES[type] ?? type;

export function allNodes(nodes: PopupNode[]): PopupNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

const asRecord = (v: unknown) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : undefined);

/** Every action a block or its countdown can run. */
function actionsOf(node: PopupNode): Record<string, unknown>[] {
  return [node.props.action, node.props.onEnd].map(asRecord).filter((a): a is Record<string, unknown> => !!a && typeof a.type === "string");
}

export function textsOf(popup: Popup): string[] {
  return allNodes(popup.children).flatMap((node) =>
    Object.entries(node.props).filter(([k, v]) => TEXT_KEYS.has(k) && typeof v === "string" && v.trim() !== "").map(([, v]) => v as string),
  );
}

const quote = (s: string) => `“${s.length > 48 ? `${s.slice(0, 45)}…` : s}”`;
const DEFAULT_SETTINGS = settingsSchema.parse({});

const SETTING_NAMES: Partial<Record<keyof PopupSettings, string>> = {
  width: "width", height: "height", position: "position", overlay: "dimmed page behind it", overlayBlur: "blur behind it",
  background: "background", radius: "corner roundness", shadow: "shadow", animation: "entrance", showCloseButton: "close (×) button",
  closeOnEscape: "closing with Escape", closeOnOverlayClick: "closing by clicking outside", lockScroll: "locking page scroll",
};

const STYLE_NAMES: Record<string, string> = {
  background: "background", color: "text colour", radius: "corner roundness", shadow: "shadow", gradient: "gradient",
  backdropFilter: "blur", border: "border", opacity: "opacity",
};

const describeValue = (v: unknown) => (typeof v === "boolean" ? (v ? "on" : "off") : typeof v === "string" ? v.replace(/^token:/, "") : JSON.stringify(v));

const hasResponsive = (v: unknown): boolean => {
  const o = asRecord(v);
  if (!o) return false;
  if (Object.keys(o).length > 0 && Object.keys(o).every((k) => k === "desktop" || k === "tablet" || k === "mobile")) return true;
  return Object.values(o).some(hasResponsive);
};

function actionLabel(a: Record<string, unknown>): string {
  switch (a.type) {
    case "dismiss": return "A button closes the popup";
    case "navigate": return "A button goes to a page on your site";
    case "external_url": return "A button opens a web address";
    default: return `A button tells your app “${String(a.name)}”`;
  }
}

/**
 * The checklist for a challenge, worked out from its finished popup: the blocks used, the words,
 * the actions, the popup-wide settings, the styling and the variables. Capped so it stays readable.
 */
export function deriveObjectives(target: Popup): Objective[] {
  const out: Objective[] = [];
  const nodes = allNodes(target.children);

  // Blocks
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  for (const [type, count] of counts) {
    if (type === "section" && count === 1) continue;
    out.push({
      id: `block:${type}`,
      label: count > 1 ? `Use ${count} ${blockName(type)} blocks` : `Add a ${blockName(type)} block`,
      passed: (a) => allNodes(a.children).filter((n) => n.type === type).length >= count,
    });
  }

  // Words
  const seenText = new Set<string>();
  for (const text of textsOf(target)) {
    const key = text.trim().toLowerCase();
    if (seenText.has(key) || seenText.size >= 6) continue;
    seenText.add(key);
    out.push({ id: `text:${key}`, label: `Say ${quote(text.trim())}`, passed: (a) => textsOf(a).some((t) => textSimilarity(t, text) >= 0.8) });
  }

  // Actions
  const seenAction = new Set<string>();
  for (const node of nodes) {
    for (const action of actionsOf(node)) {
      const sig = `${action.type}:${action.name ?? ""}`;
      if (seenAction.has(sig)) continue;
      seenAction.add(sig);
      const matches = (a: Popup) => allNodes(a.children).flatMap(actionsOf).filter((x) => x.type === action.type && (x.name ?? "") === (action.name ?? ""));
      out.push({ id: `action:${sig}`, label: actionLabel(action), passed: (a) => matches(a).length > 0 });
      if (action.type === "event") {
        if (action.closeFirst) out.push({ id: `closefirst:${sig}`, label: `…and it closes the popup first`, passed: (a) => matches(a).some((x) => x.closeFirst === true) });
        if (action.onSuccess === "close") out.push({ id: `onsuccess:${sig}`, label: `…and the popup closes when your app says it worked`, passed: (a) => matches(a).some((x) => x.onSuccess === "close") });
        if (action.successMessage) out.push({ id: `okmsg:${sig}`, label: `…and the button shows a success message`, passed: (a) => matches(a).some((x) => !!x.successMessage) });
        if (action.errorMessage) out.push({ id: `errmsg:${sig}`, label: `…and the button shows a failure message`, passed: (a) => matches(a).some((x) => !!x.errorMessage) });
        for (const field of Object.keys(asRecord(action.payload) ?? {})) {
          out.push({ id: `payload:${sig}:${field}`, label: `…and it sends “${field}” to your app`, passed: (a) => matches(a).some((x) => field in (asRecord(x.payload) ?? {})) });
        }
      }
    }
  }

  // Popup-wide settings
  for (const [key, name] of Object.entries(SETTING_NAMES) as [keyof PopupSettings, string][]) {
    const wanted = target.settings[key];
    if (JSON.stringify(wanted) === JSON.stringify(DEFAULT_SETTINGS[key])) continue;
    out.push({ id: `setting:${key}`, label: `Set the popup’s ${name} to ${describeValue(wanted)}`, passed: (a) => valueSimilarity(wanted, a.settings[key], key) >= 0.85 });
  }
  for (const token of Object.keys(target.settings.tokens)) {
    if (!token.startsWith("font.")) continue;
    const wanted = target.settings.tokens[token];
    out.push({
      id: `token:${token}`,
      label: `Set the popup’s ${token === "font.heading" ? "heading" : "body"} font to ${wanted.split(",")[0].replace(/['"]/g, "").replace(" Variable", "")}`,
      passed: (a) => (a.settings.tokens[token] ?? "").split(",")[0] === wanted.split(",")[0],
    });
  }

  // Styling
  const seenStyle = new Set<string>();
  for (const node of nodes) {
    for (const [key, name] of Object.entries(STYLE_NAMES)) {
      const value = (node.style as Record<string, unknown> | undefined)?.[key];
      if (value === undefined || seenStyle.size >= 5) continue;
      const sig = `${key}:${JSON.stringify(value)}`;
      if (seenStyle.has(sig)) continue;
      seenStyle.add(sig);
      out.push({
        id: `style:${sig}`,
        label: `Give a block ${name} ${typeof value === "string" ? describeValue(value).slice(0, 40) : "like the target"}`,
        passed: (a) => allNodes(a.children).some((n) => valueSimilarity(value, (n.style as Record<string, unknown> | undefined)?.[key], key) >= 0.85),
      });
    }
  }

  // Devices
  if (nodes.some((n) => hasResponsive(n.props) || hasResponsive(n.style))) {
    out.push({
      id: "responsive",
      label: "Use a different value on mobile than on desktop",
      passed: (a) => allNodes(a.children).some((n) => [n.props, n.style].some(hasResponsive)),
    });
  }

  // Variables
  for (const variable of target.variables) {
    out.push({
      id: `variable:${variable.name}`,
      label: Array.isArray(variable.sample) ? `Add a list variable called “${variable.name}”` : `Add a variable called “${variable.name}”`,
      passed: (a) => a.variables.some((v) => v.name === variable.name && Array.isArray(v.sample) === Array.isArray(variable.sample)),
    });
    out.push({
      id: `use:${variable.name}`,
      label: Array.isArray(variable.sample) ? `Repeat a block over “${variable.name}”` : `Use {{${variable.name}}} in some text`,
      passed: (a) =>
        Array.isArray(variable.sample)
          ? allNodes(a.children).some((n) => n.type === "repeater" && n.props.source === variable.name)
          : textsOf(a).some((t) => new RegExp(`\\{\\{\\s*${variable.name}\\s*[|}]`).test(t)),
    });
  }

  return out.slice(0, 16);
}
