/**
 * Shared validators for values that end up in CSS, URLs, or identifiers.
 * Everything user-authored passes through here before it reaches the DOM.
 */

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const ASSET_PROTOCOLS = new Set(["http:", "https:"]);
const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i;
const PROBE_BASE = "http://popsy.invalid";

export interface UrlOptions {
  /** Allow path-relative URLs such as `/pricing` or `?tab=2`. */
  allowRelative?: boolean;
  protocols?: ReadonlySet<string>;
  allowDataImage?: boolean;
}

export function isSafeUrl(value: string, opts: UrlOptions = {}): boolean {
  const { allowRelative = true, protocols = LINK_PROTOCOLS, allowDataImage = false } = opts;
  const url = value.trim();
  if (!url) return false;
  if (allowDataImage && DATA_IMAGE.test(url)) return true;
  // The WHATWG parser strips tabs/newlines, so "java\nscript:" is caught as `javascript:`.
  let parsed: URL;
  try {
    parsed = new URL(url, PROBE_BASE);
  } catch {
    return false;
  }
  // Resolved against our probe base, so the input was relative.
  if (parsed.origin === PROBE_BASE) return allowRelative;
  return protocols.has(parsed.protocol);
}

export const isSafeLinkUrl = (v: string) => isSafeUrl(v, { protocols: LINK_PROTOCOLS });
export const isSafeAssetUrl = (v: string) =>
  isSafeUrl(v, { protocols: ASSET_PROTOCOLS, allowDataImage: true });
export const isSafeMediaUrl = (v: string) => isSafeUrl(v, { protocols: ASSET_PROTOCOLS });

const FORBIDDEN_CSS = /[{};<>\\]|\/\*|\*\/|url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding/i;
const MAX_CSS_VALUE = 500;

/** CSS values may not break out of a declaration or pull in external resources. */
export function isSafeCssValue(value: string): boolean {
  return value.length <= MAX_CSS_VALUE && !FORBIDDEN_CSS.test(value);
}

/** Node ids become CSS class names and Puck ids. */
export const NODE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
