import * as z from "zod/mini";
import { cssValue as css, responsive, TEXT_ALIGNS } from "@/design-system/styles";
import { actionSchema } from "./actions";
import { DECLARED_VARIABLE_NAME, isSafeAssetUrl, isSafeMediaUrl } from "./validation";

const cssR = responsive(css);

export const ALIGN_VALUES = ["start", "center", "end", "stretch"] as const;
export const JUSTIFY_VALUES = ["start", "center", "end", "between", "around"] as const;
export const TEXT_VARIANTS = ["heading", "subheading", "body", "caption", "label"] as const;
export const TEXT_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div"] as const;
export const TEXT_TRANSFORMS = ["none", "uppercase", "capitalize", "lowercase"] as const;
export const DECORATIONS = ["none", "underline", "line-through"] as const;
export const OBJECT_FITS = ["cover", "contain", "fill", "none", "scale-down"] as const;
export const VIDEO_OBJECT_FITS = ["cover", "contain", "fill"] as const;
export const LOADING_MODES = ["lazy", "eager"] as const;
export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "link"] as const;
export const BUTTON_SIZES = ["sm", "md", "lg"] as const;
export const BADGE_VARIANTS = ["solid", "soft", "outline"] as const;
export const BADGE_SIZES = ["sm", "md"] as const;
export const ICON_POSITIONS = ["left", "right"] as const;
export const FLEX_DIRECTIONS = ["row", "column", "row-reverse", "column-reverse"] as const;
export const ORIENTATIONS = ["horizontal", "vertical"] as const;
export const LINE_STYLES = ["solid", "dashed", "dotted"] as const;

const align = responsive(z.enum(ALIGN_VALUES));
const justify = responsive(z.enum(JUSTIFY_VALUES));

/** A number that also accepts numeric text, which older editor versions saved for number settings. */
const numberish = <T extends z.ZodMiniType<number>>(schema: T) =>
  z.pipe(
    z.transform((v: unknown) => (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : v)),
    schema,
  );

const text = (max: number) => z.string().check(z.maxLength(max));
const assetUrl = z.string().check(z.refine(isSafeAssetUrl, "unsafe or invalid URL"));

export const ICON_NAMES = [
  "check", "x", "plus", "minus", "star", "heart", "gift", "bell", "mail", "phone",
  "user", "users", "lock", "unlock", "shield", "zap", "flame", "trophy", "crown", "clock",
  "calendar", "map-pin", "search", "settings", "info", "alert-triangle", "help-circle",
  "arrow-right", "arrow-left", "arrow-up", "arrow-down", "chevron-right", "chevron-down",
  "external-link", "download", "share", "play", "pause", "sparkles", "tag", "percent",
  "credit-card", "shopping-cart", "thumbs-up", "smile", "globe",
] as const;
export const iconName = z.enum(ICON_NAMES);
export type IconName = z.infer<typeof iconName>;

export const textProps = z.strictObject({
  content: z._default(text(5000), ""),
  variant: z._default(z.enum(TEXT_VARIANTS), "body"),
  tag: z.optional(z.enum(TEXT_TAGS)),
  fontFamily: z.optional(css),
  fontSize: z.optional(cssR),
  fontWeight: z.optional(responsive(z.union([z.int().check(z.gte(100), z.lte(900)), css]))),
  lineHeight: z.optional(cssR),
  letterSpacing: z.optional(cssR),
  align: z.optional(responsive(z.enum(TEXT_ALIGNS))),
  decoration: z.optional(z.enum(DECORATIONS)),
  textTransform: z.optional(z.enum(TEXT_TRANSFORMS)),
});

export const richTextProps = z.strictObject({
  content: z._default(text(10000), ""),
});

export const imageProps = z.strictObject({
  src: assetUrl,
  alt: z._default(text(500), ""),
  objectFit: z.optional(z.enum(OBJECT_FITS)),
  objectPosition: z.optional(css),
  loading: z.optional(z.enum(LOADING_MODES)),
  action: z.optional(actionSchema),
});

export const videoProps = z.strictObject({
  src: z.string().check(z.refine(isSafeMediaUrl, "unsafe or invalid URL")),
  poster: z.optional(assetUrl),
  controls: z._default(z.boolean(), true),
  autoplay: z._default(z.boolean(), false),
  muted: z._default(z.boolean(), false),
  loop: z._default(z.boolean(), false),
  aspectRatio: z.optional(css),
  objectFit: z.optional(z.enum(VIDEO_OBJECT_FITS)),
});

export const iconProps = z.strictObject({
  name: iconName,
  size: z.optional(cssR),
  color: z.optional(css),
  rotation: z.optional(numberish(z.number().check(z.gte(-360), z.lte(360)))),
  label: z.optional(text(200)),
});

export const buttonProps = z.strictObject({
  label: z._default(text(200), "Button"),
  variant: z._default(z.enum(BUTTON_VARIANTS), "solid"),
  size: z._default(z.enum(BUTTON_SIZES), "md"),
  icon: z.optional(iconName),
  iconPosition: z._default(z.enum(ICON_POSITIONS), "left"),
  fullWidth: z._default(z.boolean(), false),
  disabled: z._default(z.boolean(), false),
  action: z.optional(actionSchema),
});

export const badgeProps = z.strictObject({
  text: z._default(text(200), ""),
  icon: z.optional(iconName),
  variant: z._default(z.enum(BADGE_VARIANTS), "soft"),
  size: z._default(z.enum(BADGE_SIZES), "md"),
});

export const stackProps = z.strictObject({ gap: z.optional(cssR), align: z.optional(align), justify: z.optional(justify) });

export const flexProps = z.strictObject({
  direction: z.optional(responsive(z.enum(FLEX_DIRECTIONS))),
  wrap: z.optional(responsive(z.boolean())),
  gap: z.optional(cssR),
  align: z.optional(align),
  justify: z.optional(justify),
});

export const gridProps = z.strictObject({
  columns: z.optional(responsive(css)),
  rows: z.optional(responsive(css)),
  gap: z.optional(cssR),
  align: z.optional(align),
  justify: z.optional(justify),
});

export const COUNTDOWN_MODES = ["date", "duration"] as const;
export const COUNTDOWN_LOOKS = ["tiles", "plain"] as const;
export const COUNTDOWN_SIZES = ["sm", "md", "lg"] as const;

export const countdownProps = z
  .strictObject({
    mode: z._default(z.enum(COUNTDOWN_MODES), "date"),
    target: z.optional(z.iso.datetime({ offset: true })),
    durationMinutes: z._default(numberish(z.number().check(z.gte(1), z.lte(10080))), 15),
    showDays: z._default(z.boolean(), true),
    showSeconds: z._default(z.boolean(), true),
    showLabels: z._default(z.boolean(), true),
    look: z._default(z.enum(COUNTDOWN_LOOKS), "tiles"),
    size: z._default(z.enum(COUNTDOWN_SIZES), "md"),
    endText: z.optional(text(200)),
    onEnd: z.optional(actionSchema),
  })
  .check(
    z.refine((props) => props.mode !== "date" || props.target !== undefined, {
      path: ["target"],
      message: "choose the date and time to count down to",
    }),
  );

export const repeaterProps = z.strictObject({
  /** The list variable to repeat over; each copy can use `{{item.*}}` and `{{index}}`. */
  source: z._default(z.string().check(z.regex(DECLARED_VARIABLE_NAME, "pick a list variable")), "items"),
  columns: z.optional(responsive(css)),
  gap: z.optional(cssR),
  limit: z.optional(numberish(z.int().check(z.gte(1), z.lte(50)))),
  emptyText: z.optional(text(200)),
});

export const layersProps = z.strictObject({ height: z._default(cssR, "320px") });

export const spacerProps = z.strictObject({ height: z._default(cssR, "16px") });

export const dividerProps = z.strictObject({
  orientation: z._default(z.enum(ORIENTATIONS), "horizontal"),
  thickness: z._default(css, "1px"),
  style: z._default(z.enum(LINE_STYLES), "solid"),
  color: z._default(css, "token:color.border"),
  spacing: z.optional(cssR),
});

const emptyProps = z.strictObject({});

export interface ComponentDef {
  type: string;
  editorKey: string;
  label: string;
  category: "layout" | "content";
  props: z.ZodMiniType<Record<string, unknown>>;
  container: boolean;
}

export const COMPONENTS: ComponentDef[] = [
  { type: "section", editorKey: "Section", label: "Section", category: "layout", props: emptyProps, container: true },
  { type: "container", editorKey: "Container", label: "Container", category: "layout", props: emptyProps, container: true },
  { type: "layers", editorKey: "Layers", label: "Layers", category: "layout", props: layersProps, container: true },
  { type: "repeater", editorKey: "Repeater", label: "Repeater", category: "layout", props: repeaterProps, container: true },
  { type: "stack", editorKey: "Stack", label: "Stack", category: "layout", props: stackProps, container: true },
  { type: "flex", editorKey: "Flex", label: "Flex", category: "layout", props: flexProps, container: true },
  { type: "grid", editorKey: "Grid", label: "Grid", category: "layout", props: gridProps, container: true },
  { type: "spacer", editorKey: "Spacer", label: "Spacer", category: "layout", props: spacerProps, container: false },
  { type: "divider", editorKey: "Divider", label: "Divider", category: "layout", props: dividerProps, container: false },
  { type: "text", editorKey: "Text", label: "Text", category: "content", props: textProps, container: false },
  { type: "richtext", editorKey: "RichText", label: "Rich Text", category: "content", props: richTextProps, container: false },
  { type: "image", editorKey: "Image", label: "Image", category: "content", props: imageProps, container: false },
  { type: "video", editorKey: "Video", label: "Video", category: "content", props: videoProps, container: false },
  { type: "icon", editorKey: "Icon", label: "Icon", category: "content", props: iconProps, container: false },
  { type: "button", editorKey: "Button", label: "Button", category: "content", props: buttonProps, container: false },
  { type: "countdown", editorKey: "Countdown", label: "Countdown", category: "content", props: countdownProps, container: false },
  { type: "badge", editorKey: "Badge", label: "Badge", category: "content", props: badgeProps, container: false },
];

export const COMPONENT_MAP: Record<string, ComponentDef> = Object.fromEntries(
  COMPONENTS.map((c) => [c.type, c]),
);
