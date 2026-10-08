import type { Action } from "@/schema/actions";
import { VARIABLE_NAME } from "@/schema/validation";

const NAME = VARIABLE_NAME.source.slice(1, -1);
/** `{{ name }}` or `{{ name | fallback }}`. */
const TOKEN = new RegExp(`\\{\\{\\s*(${NAME})\\s*(?:\\|([^{}]*))?\\}\\}`, "g");
const WHOLE_TOKEN = new RegExp(`^\\s*\\{\\{\\s*${NAME}\\s*(?:\\|[^{}]*)?\\}\\}\\s*$`);

export interface DeclaredVariable {
  name: string;
  defaultValue?: string;
  /** Sample items for a list variable, used when the host sends no list. */
  sample?: unknown[];
}

export interface TemplaterOptions {
  /** Values supplied by the host page. Nested objects are reached with dotted names. */
  values?: Record<string, unknown>;
  /** Variables declared on the popup, whose defaults apply when the host sends nothing. */
  declared?: readonly DeclaredVariable[];
  /** Leave unresolved `{{tokens}}` visible instead of blank, so authors can spot them in the editor. */
  keepMissing?: boolean;
}

export interface Templater {
  /** Fills variables into plain text. */
  text(template: string): string;
  /** Fills variables into a URL. A URL that is only a variable takes the value as is; otherwise values are URL-encoded. */
  url(template: string): string;
  /** The items of a list variable: the host's list, else the declared sample, else none. */
  list(name: string): unknown[];
  /** A templater that also sees `extra` values, such as the current `item` inside a repeater. */
  scope(extra: Record<string, unknown>): Templater;
}

const hasOwn = (target: object, key: string) => Object.prototype.hasOwnProperty.call(target, key);

/** Follows a dotted path through plain objects and arrays (`items.0.price`), reading only own properties. */
function lookupRaw(values: Record<string, unknown>, name: string): unknown {
  let current: unknown = values;
  for (const key of name.split(".")) {
    if (Array.isArray(current)) {
      if (!/^\d+$/.test(key)) return undefined;
      current = current[Number(key)];
    } else if (current !== null && typeof current === "object" && hasOwn(current, key)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function lookup(values: Record<string, unknown>, name: string): string | undefined {
  const current = lookupRaw(values, name);
  if (typeof current === "string") return current;
  if (typeof current === "number" && Number.isFinite(current)) return String(current);
  if (typeof current === "boolean") return String(current);
  return undefined;
}

export const hasVariables = (template: string) => template.includes("{{");

/** The distinct variable names a template uses, in order of first use. */
export function variablesIn(template: string): string[] {
  return [...new Set(Array.from(template.matchAll(TOKEN), (m) => m[1]))];
}

export function createTemplater({ values = {}, declared = [], keepMissing = false }: TemplaterOptions = {}): Templater {
  const defaults = new Map(declared.map((v) => [v.name, v.defaultValue]));
  const samples: Record<string, unknown> = Object.fromEntries(declared.filter((v) => Array.isArray(v.sample)).map((v) => [v.name, v.sample]));
  const resolve = (name: string, fallback: string | undefined): string | undefined => {
    const value = lookup(values, name);
    if (value) return value;
    const inline = fallback?.trim();
    if (inline) return inline;
    return defaults.get(name) || lookup(samples, name) || undefined;
  };
  const fill = (template: string, encode: (value: string) => string) =>
    hasVariables(template)
      ? template.replace(TOKEN, (token, name: string, fallback?: string) => {
          const value = resolve(name, fallback);
          return value === undefined ? (keepMissing ? token : "") : encode(value);
        })
      : template;

  return {
    text: (template) => fill(template, (value) => value),
    url: (template) => (WHOLE_TOKEN.test(template) ? fill(template.trim(), (value) => value.trim()) : fill(template, encodeURIComponent)),
    list: (name) => {
      const value = lookupRaw(values, name);
      if (Array.isArray(value)) return value;
      const sample = samples[name];
      return Array.isArray(sample) ? sample : [];
    },
    scope: (extra) => createTemplater({ values: { ...values, ...extra }, declared, keepMissing }),
  };
}

// Private-use characters authors never type, so a marker can't collide with real text.
const MARK_OPEN = "\uE000";
const MARK_CLOSE = "\uE001";
const MARKER = /\uE000(\d+)\uE001/g;

/** Swaps every `{{token}}` for an opaque marker so other parsers (like rich text) can't split or misread it. */
export function protectTokens(template: string): { masked: string; restore: (text: string) => string } {
  const tokens: string[] = [];
  const masked = template.replace(TOKEN, (token) => `${MARK_OPEN}${tokens.push(token) - 1}${MARK_CLOSE}`);
  return {
    masked,
    restore: (text) => (tokens.length ? text.replace(MARKER, (marker, i: string) => tokens[Number(i)] ?? marker) : text),
  };
}

function fillPayload(value: unknown, t: Templater): unknown {
  if (typeof value === "string") return t.text(value);
  if (Array.isArray(value)) return value.map((item) => fillPayload(item, t));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillPayload(v, t)]));
  }
  return value;
}

/** Fills variables into an action's link or event payload just before it runs. */
export function fillAction(action: Action | undefined, t: Templater): Action | undefined {
  switch (action?.type) {
    case "navigate":
      return { ...action, to: t.url(action.to) };
    case "external_url":
      return { ...action, url: t.url(action.url) };
    case "event":
      return action.payload ? { ...action, payload: fillPayload(action.payload, t) as Record<string, unknown> } : action;
    default:
      return action;
  }
}
