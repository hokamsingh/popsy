"use client";
import { useMemo, type ElementType } from "react";
import { Frame, type NodeBaseProps } from "../frame";
import { ICONS } from "./icons";
import { renderRichText } from "@/runtime/richtext";
import { useRuntime } from "@/runtime/context";
import type { Action } from "@/schema/actions";
import type { IconName } from "@/schema/components";
import { mapResponsive, type Responsive } from "@/design-system/responsive";

type Css = Responsive<string>;

const VARIANTS = {
  heading: { size: "28px", weight: 700, line: "1.2", tag: "h2", family: "token:font.heading" },
  subheading: { size: "20px", weight: 600, line: "1.3", tag: "h3", family: "token:font.heading" },
  body: { size: "16px", weight: 400, line: "1.5", tag: "p", family: "token:font.body" },
  caption: { size: "13px", weight: 400, line: "1.4", tag: "p", family: "token:font.body" },
  label: { size: "14px", weight: 600, line: "1.4", tag: "span", family: "token:font.body" },
} as const;

export function Text({
  content = "",
  variant = "body",
  tag,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  align,
  decoration,
  textTransform,
  ...p
}: NodeBaseProps & {
  content?: string;
  variant?: keyof typeof VARIANTS;
  tag?: string;
  fontFamily?: string;
  fontSize?: Css;
  fontWeight?: Responsive<number | string>;
  lineHeight?: Css;
  letterSpacing?: Css;
  align?: Responsive<string>;
  decoration?: string;
  textTransform?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <Frame
      {...p}
      as={(tag ?? v.tag) as ElementType}
      kind="text"
      cssProps={{
        margin: "0",
        "font-family": fontFamily ?? v.family,
        "font-size": fontSize ?? v.size,
        "font-weight": mapResponsive(fontWeight, String) ?? String(v.weight),
        "line-height": lineHeight ?? v.line,
        "letter-spacing": letterSpacing,
        "text-align": align,
        "text-decoration": decoration,
        "text-transform": textTransform,
        "white-space": "pre-wrap",
        "overflow-wrap": "anywhere",
      }}
    >
      {content}
    </Frame>
  );
}

const richTextRules = (sel: string) =>
  `${sel} p{margin:0 0 .75em}${sel} p:last-child{margin-bottom:0}${sel} ul{margin:0 0 .75em;padding-left:1.25em}${sel} a{color:var(--pp-color-primary);text-decoration:underline}`;

export function RichText({ content = "", ...p }: NodeBaseProps & { content?: string }) {
  const body = useMemo(() => renderRichText(content), [content]);
  return (
    <Frame
      {...p}
      kind="richtext"
      cssProps={{ "font-family": "token:font.body", "font-size": "16px", "line-height": "1.5" }}
      nested={richTextRules}
    >
      {body}
    </Frame>
  );
}

function useActionHandler(action: Action | undefined) {
  const { run, editing } = useRuntime();
  return editing || !action ? undefined : () => run(action);
}

export function Image({
  src,
  alt = "",
  objectFit,
  objectPosition,
  loading = "lazy",
  action,
  ...p
}: NodeBaseProps & {
  src: string;
  alt?: string;
  objectFit?: string;
  objectPosition?: string;
  loading?: "lazy" | "eager";
  action?: Action;
}) {
  const onClick = useActionHandler(action);
  return (
    <Frame
      {...p}
      as="img"
      kind="image"
      attrs={{
        src,
        alt,
        loading,
        draggable: false,
        role: alt === "" ? "presentation" : undefined,
        onClick,
      }}
      cssProps={{
        display: "block",
        cursor: action ? "pointer" : undefined,
        "max-width": "100%",
        "object-fit": objectFit,
        "object-position": objectPosition,
      }}
    />
  );
}

export function Video({
  src,
  poster,
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  aspectRatio,
  objectFit,
  ...p
}: NodeBaseProps & {
  src: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  aspectRatio?: string;
  objectFit?: string;
}) {
  const { editing } = useRuntime();
  return (
    <Frame
      {...p}
      as="video"
      kind="video"
      attrs={{
        src,
        poster,
        controls,
        autoPlay: autoplay && !editing,
        muted: muted || (autoplay && !editing),
        loop,
        playsInline: true,
        preload: "metadata",
      }}
      cssProps={{ display: "block", width: "100%", "aspect-ratio": aspectRatio, "object-fit": objectFit }}
    />
  );
}

export function Icon({
  name,
  size = "24px",
  color,
  rotation,
  label,
  ...p
}: NodeBaseProps & { name: IconName; size?: Css; color?: string; rotation?: number; label?: string }) {
  const Glyph = ICONS[name];
  return (
    <Frame
      {...p}
      as="span"
      kind="icon"
      attrs={{ role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true }}
      cssProps={{
        display: "inline-flex",
        width: size,
        height: size,
        color,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        "flex-shrink": "0",
      }}
    >
      <Glyph width="100%" height="100%" aria-hidden />
    </Frame>
  );
}

const TONES = {
  solid: { background: "token:color.primary", color: "token:color.primary-contrast", border: "1px solid transparent" },
  outline: { background: "transparent", color: "token:color.primary", border: "1px solid token:color.primary" },
  soft: { background: "color-mix(in srgb, var(--pp-color-primary) 14%, transparent)", color: "token:color.primary", border: "1px solid transparent" },
} as const;
const BUTTON_LOOKS = {
  solid: TONES.solid,
  outline: TONES.outline,
  ghost: { ...TONES.outline, border: "1px solid transparent", color: "token:color.primary", background: "transparent" },
  link: { background: "transparent", color: "token:color.primary", border: "0" },
} as const;
const BADGE_LOOKS = TONES;

const BUTTON_SIZES = {
  sm: { pad: "6px 12px", font: "13px" },
  md: { pad: "10px 18px", font: "15px" },
  lg: { pad: "14px 26px", font: "17px" },
} as const;

export function Button({
  label = "Button",
  variant = "solid",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled = false,
  action,
  ...p
}: NodeBaseProps & {
  label?: string;
  variant?: "solid" | "outline" | "ghost" | "link";
  size?: keyof typeof BUTTON_SIZES;
  icon?: IconName;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  disabled?: boolean;
  action?: Action;
}) {
  const onClick = useActionHandler(action);
  const s = BUTTON_SIZES[size];
  const Glyph = icon ? ICONS[icon] : null;
  const look = BUTTON_LOOKS[variant];
  return (
    <Frame
      {...p}
      as="button"
      kind="button"
      attrs={{ type: "button", disabled, onClick }}
      cssProps={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        "align-items": "center",
        "justify-content": "center",
        gap: "8px",
        padding: variant === "link" ? "0" : s.pad,
        "font-size": s.font,
        "font-weight": "600",
        "font-family": "inherit",
        "line-height": "1.2",
        "border-radius": "token:radius.md",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? "0.5" : undefined,
        "text-decoration": variant === "link" ? "underline" : "none",
        ...look,
      }}
    >
      {Glyph && iconPosition === "left" ? <Glyph width="1.1em" height="1.1em" aria-hidden /> : null}
      <span>{label}</span>
      {Glyph && iconPosition === "right" ? <Glyph width="1.1em" height="1.1em" aria-hidden /> : null}
    </Frame>
  );
}

export function Badge({
  text = "",
  icon,
  variant = "soft",
  size = "md",
  ...p
}: NodeBaseProps & { text?: string; icon?: IconName; variant?: "solid" | "soft" | "outline"; size?: "sm" | "md" }) {
  const Glyph = icon ? ICONS[icon] : null;
  const look = BADGE_LOOKS[variant];
  return (
    <Frame
      {...p}
      as="span"
      kind="badge"
      cssProps={{
        display: "inline-flex",
        "align-items": "center",
        gap: "4px",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        "font-size": size === "sm" ? "11px" : "13px",
        "font-weight": "600",
        "border-radius": "token:radius.full",
        "align-self": "auto",
        ...look,
      }}
    >
      {Glyph ? <Glyph width="1em" height="1em" aria-hidden /> : null}
      {text}
    </Frame>
  );
}
