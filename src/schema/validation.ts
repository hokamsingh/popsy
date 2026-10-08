
const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const ASSET_PROTOCOLS = new Set(["http:", "https:"]);
const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i;
const PROBE_BASE = "http://popsy.invalid";

interface UrlOptions {
  protocols?: ReadonlySet<string>;
  allowDataImage?: boolean;
}

function isSafeUrl(value: string, { protocols = LINK_PROTOCOLS, allowDataImage = false }: UrlOptions = {}): boolean {
  const url = value.trim();
  if (!url) return false;
  if (allowDataImage && DATA_IMAGE.test(url)) return true;
  let parsed: URL;
  try {
    parsed = new URL(url, PROBE_BASE);
  } catch {
    return false;
  }
  return parsed.origin === PROBE_BASE || protocols.has(parsed.protocol);
}

export const isSafeLinkUrl = (v: string) => isSafeUrl(v);
export const isSafeAssetUrl = (v: string) =>
  isSafeUrl(v, { protocols: ASSET_PROTOCOLS, allowDataImage: true });
export const isSafeMediaUrl = (v: string) => isSafeUrl(v, { protocols: ASSET_PROTOCOLS });

const FORBIDDEN_CSS = /[{};<>\\]|\/\*|\*\/|url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding/i;
const MAX_CSS_VALUE = 500;

export function isSafeCssValue(value: string): boolean {
  return value.length <= MAX_CSS_VALUE && !FORBIDDEN_CSS.test(value);
}

export const NODE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** A variable name: letters, digits and underscores, with dots to reach into nested values (`user.firstName`). */
export const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
