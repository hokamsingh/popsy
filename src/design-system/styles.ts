import { z } from "zod";
import { isSafeAssetUrl, isSafeCssValue } from "@/schema/validation";
import {
  BREAKPOINTS,
  MEDIA,
  expandResponsive,
  resolveResponsive,
  type Responsive,
} from "./responsive";
import { isTokenName, resolveTokens } from "./tokens";

// ---------- Schema ----------

const cssValue = z
  .string()
  .max(500)
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

/** The one shared style model every node consumes. */
export const styleSchema = z
  .object({
    // spacing
    padding: css,
    margin: css,
    // sizing
    width: css,
    height: css,
    minWidth: css,
    minHeight: css,
    maxWidth: css,
    maxHeight: css,
    // colors / typography inheritance
    color: css,
    textAlign: responsive(z.enum(["left", "center", "right", "justify"])),
    // backgrounds
    background: css,
    gradient: css,
    backgroundImage: z.string().refine(isSafeAssetUrl, "unsafe or invalid URL"),
    backgroundSize: css,
    backgroundPosition: css,
    // borders / effects
    border: css,
    radius: css,
    shadow: css,
    opacity: responsive(z.number().min(0).max(1)),
    overflow: responsive(z.enum(["visible", "hidden", "auto", "scroll"])),
    // positioning
    position: responsive(z.enum(["static", "relative", "absolute", "sticky"])),
    // visibility
    hidden: responsive(z.boolean()),
  })
  .partial()
  .strict();

export type Style = z.infer<typeof styleSchema>;
export type Decls = Record<string, Responsive<string | number | boolean | undefined> | undefined>;

// ---------- CSS generation ----------

const SIMPLE_MAP: Record<string, string> = {
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

/**
 * Builds the stylesheet for one node.
 * `decls` are css-property → responsive value; `style` is the shared Style model.
 * Base declarations come first, then tablet, then mobile overrides.
 */
export function buildCss(selector: string, decls: Decls = {}, style: Style = {}): string {
  const perBp: Record<"desktop" | "tablet" | "mobile", [string, string][]> = {
    desktop: [],
    tablet: [],
    mobile: [],
  };

  const push = (prop: string, value: Responsive<string | number | boolean | undefined> | undefined) => {
    const raw = expandResponsive(value);
    for (const bp of BREAKPOINTS) {
      const v = raw[bp];
      if (v === undefined || typeof v === "boolean") continue;
      const s = serialize(v);
      if (s !== undefined) perBp[bp].push([prop, s]);
    }
  };

  for (const [prop, value] of Object.entries(decls)) push(prop, value);
  for (const [key, prop] of Object.entries(SIMPLE_MAP)) {
    push(prop, style[key as keyof Style] as Responsive<string | number | undefined> | undefined);
  }
  if (style.backgroundImage && isSafeAssetUrl(style.backgroundImage) && !style.gradient) {
    perBp.desktop.push(["background-image", `url("${encodeURI(style.backgroundImage).replace(/"/g, "%22")}")`]);
  }

  const out: string[] = [];
  if (perBp.desktop.length) out.push(`${selector}{${declBlock(perBp.desktop)}}`);
  if (perBp.tablet.length) out.push(`@media ${MEDIA.tablet}{${selector}{${declBlock(perBp.tablet)}}}`);
  if (perBp.mobile.length) out.push(`@media ${MEDIA.mobile}{${selector}{${declBlock(perBp.mobile)}}}`);

  // Visibility is range-based so "hidden on desktop only" works despite cascade.
  const hidden = resolveResponsive(style.hidden);
  const ranges: [boolean | undefined, string][] = [
    [hidden.desktop, MEDIA.desktopOnly],
    [hidden.tablet, MEDIA.tabletOnly],
    [hidden.mobile, MEDIA.mobile],
  ];
  for (const [isHidden, media] of ranges) {
    if (isHidden) out.push(`@media ${media}{${selector}{display:none!important}}`);
  }
  return out.join("");
}
