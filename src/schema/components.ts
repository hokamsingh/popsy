import { z } from "zod";
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

export const textProps = z
  .object({
    content: z.string().max(5000).default(""),
    variant: z.enum(TEXT_VARIANTS).default("body"),
    tag: z.enum(TEXT_TAGS).optional(),
    fontFamily: css.optional(),
    fontSize: cssR.optional(),
    fontWeight: responsive(z.union([z.number().int().min(100).max(900), css])).optional(),
    lineHeight: cssR.optional(),
    letterSpacing: cssR.optional(),
    align: responsive(z.enum(TEXT_ALIGNS)).optional(),
    decoration: z.enum(DECORATIONS).optional(),
    textTransform: z.enum(TEXT_TRANSFORMS).optional(),
  })
  .strict();

export const richTextProps = z
  .object({
    content: z.string().max(10000).default(""),
  })
  .strict();

export const imageProps = z
  .object({
    src: z.string().refine(isSafeAssetUrl, "unsafe or invalid URL"),
    alt: z.string().max(500).default(""),
    objectFit: z.enum(OBJECT_FITS).optional(),
    objectPosition: css.optional(),
    loading: z.enum(LOADING_MODES).optional(),
    action: actionSchema.optional(),
  })
  .strict();

export const videoProps = z
  .object({
    src: z.string().refine(isSafeMediaUrl, "unsafe or invalid URL"),
    poster: z.string().refine(isSafeAssetUrl, "unsafe or invalid URL").optional(),
    controls: z.boolean().default(true),
    autoplay: z.boolean().default(false),
    muted: z.boolean().default(false),
    loop: z.boolean().default(false),
    aspectRatio: css.optional(),
    objectFit: z.enum(VIDEO_OBJECT_FITS).optional(),
  })
  .strict();

export const iconProps = z
  .object({
    name: iconName,
    size: cssR.optional(),
    color: css.optional(),
    rotation: z.number().min(-360).max(360).optional(),
    label: z.string().max(200).optional(),
  })
  .strict();

export const buttonProps = z
  .object({
    label: z.string().max(200).default("Button"),
    variant: z.enum(BUTTON_VARIANTS).default("solid"),
    size: z.enum(BUTTON_SIZES).default("md"),
    icon: iconName.optional(),
    iconPosition: z.enum(ICON_POSITIONS).default("left"),
    fullWidth: z.boolean().default(false),
    disabled: z.boolean().default(false),
    action: actionSchema.optional(),
  })
  .strict();

export const badgeProps = z
  .object({
    text: z.string().max(200).default(""),
    icon: iconName.optional(),
    variant: z.enum(BADGE_VARIANTS).default("soft"),
    size: z.enum(BADGE_SIZES).default("md"),
  })
  .strict();

export const stackProps = z
  .object({ gap: cssR.optional(), align: align.optional(), justify: justify.optional() })
  .strict();

export const flexProps = z
  .object({
    direction: responsive(z.enum(FLEX_DIRECTIONS)).optional(),
    wrap: responsive(z.boolean()).optional(),
    gap: cssR.optional(),
    align: align.optional(),
    justify: justify.optional(),
  })
  .strict();

export const gridProps = z
  .object({
    columns: responsive(css).optional(),
    rows: responsive(css).optional(),
    gap: cssR.optional(),
    align: align.optional(),
    justify: justify.optional(),
  })
  .strict();

export const COUNTDOWN_MODES = ["date", "duration"] as const;
export const COUNTDOWN_LOOKS = ["tiles", "plain"] as const;
export const COUNTDOWN_SIZES = ["sm", "md", "lg"] as const;

export const countdownProps = z
  .object({
    mode: z.enum(COUNTDOWN_MODES).default("date"),
    target: z.string().datetime({ offset: true }).optional(),
    durationMinutes: z.number().min(1).max(10080).default(15),
    showDays: z.boolean().default(true),
    showSeconds: z.boolean().default(true),
    showLabels: z.boolean().default(true),
    look: z.enum(COUNTDOWN_LOOKS).default("tiles"),
    size: z.enum(COUNTDOWN_SIZES).default("md"),
    endText: z.string().max(200).optional(),
    onEnd: actionSchema.optional(),
  })
  .strict()
  .refine((props) => props.mode !== "date" || props.target !== undefined, {
    path: ["target"],
    message: "choose the date and time to count down to",
  });

export const repeaterProps = z
  .object({
    /** The list variable to repeat over; each copy can use `{{item.*}}` and `{{index}}`. */
    source: z.string().regex(DECLARED_VARIABLE_NAME, "pick a list variable").default("items"),
    columns: responsive(css).optional(),
    gap: cssR.optional(),
    limit: z.number().int().min(1).max(50).optional(),
    emptyText: z.string().max(200).optional(),
  })
  .strict();

export const layersProps = z.object({ height: cssR.default("320px") }).strict();

export const spacerProps = z.object({ height: cssR.default("16px") }).strict();

export const dividerProps = z
  .object({
    orientation: z.enum(ORIENTATIONS).default("horizontal"),
    thickness: css.default("1px"),
    style: z.enum(LINE_STYLES).default("solid"),
    color: css.default("token:color.border"),
    spacing: cssR.optional(),
  })
  .strict();

const emptyProps = z.object({}).strict();

export interface ComponentDef {
  type: string;
  editorKey: string;
  label: string;
  category: "layout" | "content";
  props: z.ZodType<Record<string, unknown>>;
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
