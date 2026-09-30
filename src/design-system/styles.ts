import { z } from "zod";
import { isSafeAssetUrl, isSafeCssValue } from "@/schema/validation";
import {
  BREAKPOINTS,
  MEDIA,
  type Breakpoint,
  expandResponsive,
  resolveResponsive,
  type Responsive,
} from "./responsive";
import { ANCHORS } from "./layers";
import { isTokenName, resolveTokens } from "./tokens";

export const cssValue = z
  .string()
  .refine(isSafeCssValue, "unsafe CSS value")
  .refine(
    (v) => [...v.matchAll(/token:([^\s,)]+)/g)].every((m) => isTokenName(m[1])),
    "invalid token reference",
  );

export function responsive<T extends z.ZodType>(inner: T) {
  return z.union([
    inner,
    z
      .object({ desktop: inner.optional(), tablet: inner.optional(), mobile: inner.optional() })
      .strict(),
  ]);
}

const css = responsive(cssValue);

export const TEXT_ALIGNS = ["left", "center", "right", "justify"] as const;
export const OVERFLOWS = ["visible", "hidden", "auto", "scroll"] as const;
export const POSITION_MODES = ["static", "relative", "absolute", "sticky"] as const;

export const styleSchema = z
  .object({
    padding: css,
    margin: css,
    width: css,
    height: css,
    minWidth: css,
    minHeight: css,
    maxWidth: css,
    maxHeight: css,
    color: css,
    textAlign: responsive(z.enum(TEXT_ALIGNS)),
    background: css,
    gradient: css,
    backgroundImage: z.string().refine(isSafeAssetUrl, "unsafe or invalid URL"),
    backgroundSize: css,
    backgroundPosition: css,
    border: css,
    radius: css,
    shadow: css,
    backdropFilter: css,
    opacity: responsive(z.number().min(0).max(1)),
    overflow: responsive(z.enum(OVERFLOWS)),
    position: responsive(z.enum(POSITION_MODES)),
    hidden: responsive(z.boolean()),
    anchor: responsive(z.enum(ANCHORS)),
    offsetX: css,
    offsetY: css,
  })
  .partial()
  .strict();

export type Style = z.infer<typeof styleSchema>;
export type CssProps = Record<string, Responsive<string | number | undefined> | undefined>;

const SIMPLE_MAP: { [K in keyof Style]?: string } = {
  padding: "padding",
  margin: "margin",
  width: "width",
  height: "height",
  minWidth: "min-width",
  minHeight: "min-height",
  maxWidth: "max-width",
  maxHeight: "max-height",
  color: "color",
  textAlign: "text-align",
  background: "background-color",
  gradient: "background-image",
  backgroundSize: "background-size",
  backgroundPosition: "background-position",
  border: "border",
  radius: "border-radius",
  shadow: "box-shadow",
  backdropFilter: "backdrop-filter",
  opacity: "opacity",
  overflow: "overflow",
  position: "position",
};

const serialize = (v: string | number): string | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  if (!isSafeCssValue(v)) return undefined;
  return resolveTokens(v);
};

function declBlock(entries: [string, string][]): string {
  return entries.map(([k, v]) => `${k}:${v}`).join(";");
}

export function buildCss(selector: string, cssProps: CssProps = {}, style: Style = {}): string {
  const perBp: Record<Breakpoint, [string, string][]> = { desktop: [], tablet: [], mobile: [] };

  const push = (prop: string, value: Responsive<string | number | undefined> | undefined) => {
    const raw = expandResponsive(value);
    for (const bp of BREAKPOINTS) {
      const v = raw[bp];
      if (v === undefined) continue;
      const s = serialize(v);
      if (s !== undefined) perBp[bp].push([prop, s]);
    }
  };

  for (const [prop, value] of Object.entries(cssProps)) push(prop, value);
  push("-webkit-backdrop-filter", style.backdropFilter);
  for (const [key, prop] of Object.entries(SIMPLE_MAP) as [keyof Style, string][]) {
    push(prop, style[key] as Responsive<string | number | undefined> | undefined);
  }
  if (style.backgroundImage && isSafeAssetUrl(style.backgroundImage) && !style.gradient) {
    perBp.desktop.push(["background-image", `url("${encodeURI(style.backgroundImage).replace(/"/g, "%22")}")`]);
  }

  const out: string[] = [];
  const media: Record<Breakpoint, string | null> = { desktop: null, tablet: MEDIA.tablet, mobile: MEDIA.mobile };
  for (const bp of BREAKPOINTS) {
    if (!perBp[bp].length) continue;
    const rule = `${selector}{${declBlock(perBp[bp])}}`;
    out.push(media[bp] ? `@media ${media[bp]}{${rule}}` : rule);
  }

  const hidden = resolveResponsive(style.hidden);
  const ranges: [boolean | undefined, string][] = [
    [hidden.desktop, MEDIA.desktopOnly],
    [hidden.tablet, MEDIA.tabletOnly],
    [hidden.mobile, MEDIA.mobile],
  ];
  for (const [isHidden, range] of ranges) {
    if (isHidden) out.push(`@media ${range}{${selector}{display:none!important}}`);
  }
  return out.join("");
}
