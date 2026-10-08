import { COMPONENT_MAP } from "@/schema/components";
import { resolveResponsive, type ResponsiveObject } from "@/design-system/responsive";
import type { Popup, PopupNode, PopupSettings } from "@/schema/popup";
import { settingsSchema } from "@/schema/popup";

/** Props whose text a person reads; compared by how close the words are rather than exactly. */
export const TEXT_KEYS = new Set(["content", "label", "text", "alt", "endText", "emptyText"]);
const URL_KEYS = new Set(["src", "poster", "backgroundImage"]);

/** Popup settings worth comparing: the ones a person chooses on purpose. */
export const SETTING_KEYS = [
  "width", "height", "position", "overlay", "overlayBlur", "background", "radius", "shadow",
  "animation", "showCloseButton", "closeOnEscape", "closeOnOverlayClick", "lockScroll", "tokens",
] as const satisfies readonly (keyof PopupSettings)[];

const DEFAULT_SETTINGS = settingsSchema.parse({});

const normalizeText = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** 1 when the words match (ignoring case and spacing), falling smoothly as they differ. */
export function textSimilarity(a: string, b: string): number {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (x === y) return 1;
  const longest = Math.max(x.length, y.length);
  return longest === 0 ? 1 : Math.max(0, 1 - editDistance(x, y) / longest);
}

type Rgba = [number, number, number, number];

function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  if (v === "transparent") return [0, 0, 0, 0];
  const hex = /^#([0-9a-f]{3,8})$/.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha];
  }
  return null;
}

function colorSimilarity(a: Rgba, b: Rgba): number {
  const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const rgbScore = distance <= 14 ? 1 : Math.max(0, 1 - distance / 220);
  const alphaScore = Math.max(0, 1 - Math.abs(a[3] - b[3]) * 1.5);
  return rgbScore * alphaScore;
}

const LENGTH = /^(-?\d*\.?\d+)(px|rem|em|%|vh|vw)?$/;

function parseLength(value: string): { amount: number; unit: string } | null {
  const m = LENGTH.exec(value.trim());
  return m ? { amount: parseFloat(m[1]), unit: m[2] ?? "" } : null;
}

/** Numbers within about 10% count as the same; further apart they fall off with the ratio. */
function amountSimilarity(a: number, b: number): number {
  if (a === b) return 1;
  if (a === 0 || b === 0) return Math.abs(a - b) <= 2 ? 0.9 : 0;
  if (Math.sign(a) !== Math.sign(b)) return 0;
  const ratio = Math.min(Math.abs(a), Math.abs(b)) / Math.max(Math.abs(a), Math.abs(b));
  return ratio >= 0.9 ? 1 : ratio;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isResponsiveShape = (v: unknown) => isPlainObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => k === "desktop" || k === "tablet" || k === "mobile");

/** How alike two values are, 0 to 1. `key` tells it whether the value is words, a link, and so on. */
export function valueSimilarity(a: unknown, b: unknown, key = ""): number {
  if (a === undefined && b === undefined) return 1;
  if (a === undefined || b === undefined) return 0;

  if (isResponsiveShape(a) || isResponsiveShape(b)) {
    const left = resolveResponsive(a as never) as ResponsiveObject<unknown>;
    const right = resolveResponsive(b as never) as ResponsiveObject<unknown>;
    const devices = (["desktop", "tablet", "mobile"] as const).filter((d) => left[d] !== undefined || right[d] !== undefined);
    return devices.length ? devices.reduce((sum, d) => sum + valueSimilarity(left[d], right[d], key), 0) / devices.length : 1;
  }

  if (typeof a === "string" && typeof b === "string") {
    if (a === b) return 1;
    if (URL_KEYS.has(key)) return a.trim() && b.trim() ? (normalizeText(a) === normalizeText(b) ? 1 : 0.5) : 0;
    if (TEXT_KEYS.has(key)) return textSimilarity(a, b);
    const ca = parseColor(a);
    const cb = parseColor(b);
    if (ca && cb) return colorSimilarity(ca, cb);
    const la = parseLength(a);
    const lb = parseLength(b);
    if (la && lb) return la.unit === lb.unit ? amountSimilarity(la.amount, lb.amount) : 0.4;
    return textSimilarity(a, b);
  }

  if (typeof a === "number" && typeof b === "number") return amountSimilarity(a, b);
  if (typeof a === "boolean" || typeof b === "boolean") return a === b ? 1 : 0;

  if (Array.isArray(a) && Array.isArray(b)) {
    const longest = Math.max(a.length, b.length);
    return longest === 0 ? 1 : Array.from({ length: longest }, (_, i) => valueSimilarity(a[i], b[i], key)).reduce((s, x) => s + x, 0) / longest;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return keys.length === 0 ? 1 : keys.reduce((sum, k) => sum + valueSimilarity(a[k], b[k], k), 0) / keys.length;
  }

  return a === b ? 1 : 0;
}

const typeDefaults = new Map<string, Record<string, unknown>>();

/** What a block's settings are before anyone touches them, so only deliberate choices get compared. */
function defaultsFor(type: string): Record<string, unknown> {
  const cached = typeDefaults.get(type);
  if (cached) return cached;
  const def = COMPONENT_MAP[type];
  const attempts = [{}, { src: "x" }, { name: "star" }];
  let found: Record<string, unknown> = {};
  for (const probe of attempts) {
    const parsed = def?.props.safeParse(probe);
    if (parsed?.success) {
      found = { ...(parsed.data as Record<string, unknown>) };
      for (const k of Object.keys(probe)) delete found[k];
      break;
    }
  }
  typeDefaults.set(type, found);
  return found;
}

export interface PairComparison {
  /** 0 to 1 over the words on the block. */
  content: number | null;
  /** 0 to 1 over its other settings and its style. */
  style: number | null;
  tips: string[];
}

const show = (v: unknown) => (typeof v === "string" ? `"${v.length > 40 ? `${v.slice(0, 37)}…` : v}"` : JSON.stringify(v));

/** Compares two blocks of the same type: the words on them, and everything else a person set. */
export function comparePair(target: PopupNode, attempt: PopupNode, where: string): PairComparison {
  const defaults = defaultsFor(target.type);
  const tips: string[] = [];
  const contentSims: number[] = [];
  const styleSims: number[] = [];

  const keys = new Set<string>();
  for (const [k, v] of Object.entries(target.props)) if (JSON.stringify(v) !== JSON.stringify(defaults[k])) keys.add(k);
  for (const [k, v] of Object.entries(attempt.props)) if (JSON.stringify(v) !== JSON.stringify(defaults[k])) keys.add(k);

  for (const key of keys) {
    const sim = valueSimilarity(target.props[key] ?? defaults[key], attempt.props[key] ?? defaults[key], key);
    (TEXT_KEYS.has(key) ? contentSims : styleSims).push(sim);
    // Words are worth a tip at any difference (a typo is exactly what a learner wants pointed out).
    if (sim < (TEXT_KEYS.has(key) ? 1 : 0.75)) tips.push(`${where}: "${key}" is ${show(attempt.props[key] ?? defaults[key])}, the target has ${show(target.props[key] ?? defaults[key])}`);
  }

  const styleKeys = new Set([...Object.keys(target.style ?? {}), ...Object.keys(attempt.style ?? {})]);
  for (const key of styleKeys) {
    const sim = valueSimilarity((target.style as Record<string, unknown> | undefined)?.[key], (attempt.style as Record<string, unknown> | undefined)?.[key], key);
    styleSims.push(sim);
    if (sim < 0.75) tips.push(`${where}: style "${key}" is ${show((attempt.style as Record<string, unknown> | undefined)?.[key])}, the target has ${show((target.style as Record<string, unknown> | undefined)?.[key])}`);
  }

  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  return { content: mean(contentSims), style: mean(styleSims), tips };
}

export const countNodes = (nodes: PopupNode[]): number => nodes.reduce((n, node) => n + 1 + countNodes(node.children ?? []), 0);

interface Accumulator {
  /** Summed match of the target blocks that carry words / other settings. */
  contentScore: number;
  styleScore: number;
  tips: string[];
}

const hasWords = (node: PopupNode) => Object.keys(node.props).some((k) => TEXT_KEYS.has(k) && String(node.props[k]).trim() !== "");
const hasStyling = (node: PopupNode) => Object.keys(node.style ?? {}).length > 0 || Object.keys(node.props).some((k) => !TEXT_KEYS.has(k) && JSON.stringify(node.props[k]) !== JSON.stringify(defaultsFor(node.type)[k]));

/** How many target blocks carry words, and how many carry other deliberate settings. */
function totalsOf(nodes: PopupNode[]): { content: number; style: number } {
  const totals = { content: 0, style: 0 };
  for (const node of nodes) {
    if (hasWords(node)) totals.content += 1;
    if (hasStyling(node)) totals.style += 1;
    const inner = totalsOf(node.children ?? []);
    totals.content += inner.content;
    totals.style += inner.style;
  }
  return totals;
}

/**
 * Lines up two lists of sibling blocks in order, pairing blocks of the same type, so that moved or
 * missing blocks cost something but a single extra block doesn't throw off everything after it.
 * Returns how well the lists match (0 to 1, structure only) and fills in the accumulator.
 */
function alignLevel(target: PopupNode[], attempt: PopupNode[], acc: Accumulator, path: string): number {
  const longest = Math.max(target.length, attempt.length);
  if (longest === 0) return 1;

  const n = target.length;
  const m = attempt.length;
  // Quick pair weight: same type is required; closer words and styling break ties.
  const weight = (i: number, j: number) => {
    if (target[i].type !== attempt[j].type) return -1;
    const quick = comparePair(target[i], attempt[j], "");
    return 1 + 0.5 * (quick.content ?? 1) + 0.5 * (quick.style ?? 1);
  };

  const best = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const w = weight(i, j);
      best[i][j] = Math.max(best[i + 1][j], best[i][j + 1], w > 0 ? w + best[i + 1][j + 1] : 0);
    }
  }

  let structure = 0;
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const w = weight(i, j);
    if (w > 0 && best[i][j] === w + best[i + 1][j + 1]) {
      const label = `${path}${COMPONENT_MAP[target[i].type]?.label ?? target[i].type}`;
      const pair = comparePair(target[i], attempt[j], label);
      if (hasWords(target[i]) && pair.content !== null) acc.contentScore += pair.content;
      if (hasStyling(target[i]) && pair.style !== null) acc.styleScore += pair.style;
      acc.tips.push(...pair.tips);
      structure += 1 + alignLevel(target[i].children ?? [], attempt[j].children ?? [], acc, `${label} › `);
      i += 1;
      j += 1;
    } else if (best[i + 1][j] >= best[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  // `structure` counts each paired block once, plus its children's own 0..1 match.
  return structure / (longest * 2);
}

export interface Similarity {
  structure: number;
  content: number;
  style: number;
  settings: number;
  overall: number;
  tips: string[];
}

function compareSettings(target: Popup["settings"], attempt: Popup["settings"], tips: string[]): number {
  const sims: number[] = [];
  for (const key of SETTING_KEYS) {
    const t = target[key];
    const a = attempt[key];
    const d = DEFAULT_SETTINGS[key];
    if (JSON.stringify(t) === JSON.stringify(d) && JSON.stringify(a) === JSON.stringify(d)) continue;
    const sim = valueSimilarity(t, a, key);
    sims.push(sim);
    if (sim < 0.75) tips.push(`Popup settings: "${key}" is ${show(a)}, the target has ${show(t)}`);
  }
  return sims.length ? sims.reduce((s, x) => s + x, 0) / sims.length : 1;
}

/** How alike two popups are: layout, words, styling and popup-wide settings. */
export function compareDocuments(target: Popup, attempt: Popup): Similarity {
  const acc: Accumulator = { contentScore: 0, styleScore: 0, tips: [] };
  const totals = totalsOf(target.children);

  const structure = alignLevel(target.children, attempt.children, acc, "");
  const tips = [...acc.tips];
  const settings = compareSettings(target.settings, attempt.settings, tips);

  const content = totals.content ? Math.min(1, acc.contentScore / totals.content) : 1;
  const style = totals.style ? Math.min(1, acc.styleScore / totals.style) : 1;
  const overall = 0.4 * structure + 0.25 * content + 0.2 * style + 0.15 * settings;
  return { structure, content, style, settings, overall, tips };
}
