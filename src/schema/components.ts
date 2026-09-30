import { z } from "zod";
import { responsive } from "@/design-system/styles";
import { actionSchema } from "./actions";
import { isSafeAssetUrl, isSafeCssValue, isSafeMediaUrl } from "./validation";

const css = z.string().max(500).refine(isSafeCssValue, "unsafe CSS value");
const cssR = responsive(css);
const align = responsive(z.enum(["start", "center", "end", "stretch"]));
const justify = responsive(z.enum(["start", "center", "end", "between", "around"]));

/** Icons are a controlled set, never user-supplied SVG. Names map to lucide components in the renderer. */
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
    variant: z.enum(["heading", "subheading", "body", "caption", "label"]).default("body"),
    /** Semantic element; independent of visual variant for accessibility. */
    tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div"]).optional(),
    fontFamily: css.optional(),
    fontSize: cssR.optional(),
    fontWeight: responsive(z.union([z.number().int().min(100).max(900), css])).optional(),
    lineHeight: cssR.optional(),
    letterSpacing: cssR.optional(),
    align: responsive(z.enum(["left", "center", "right", "justify"])).optional(),
    decoration: z.enum(["none", "underline", "line-through"]).optional(),
  })
  .strict();

export const richTextProps = z
  .object({
    /** Lightweight markup: **bold**, *italic*, __underline__, [text](url), "- " lists. */
    content: z.string().max(10000).default(""),
  })
  .strict();

export const imageProps = z
  .object({
    src: z.string().refine(isSafeAssetUrl, "unsafe or invalid URL"),
    alt: z.string().max(500).default(""),
    objectFit: z.enum(["cover", "contain", "fill", "none", "scale-down"]).optional(),
    objectPosition: css.optional(),
    loading: z.enum(["lazy", "eager"]).optional(),
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
    objectFit: z.enum(["cover", "contain", "fill"]).optional(),
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
    variant: z.enum(["solid", "outline", "ghost", "link"]).default("solid"),
    size: z.enum(["sm", "md", "lg"]).default("md"),
    icon: iconName.optional(),
    iconPosition: z.enum(["left", "right"]).default("left"),
    fullWidth: z.boolean().default(false),
    disabled: z.boolean().default(false),
    action: actionSchema.optional(),
  })
  .strict();

export const badgeProps = z
  .object({
    text: z.string().max(200).default(""),
    icon: iconName.optional(),
    variant: z.enum(["solid", "soft", "outline"]).default("soft"),
    size: z.enum(["sm", "md"]).default("md"),
  })
  .strict();

export const stackProps = z
  .object({ gap: cssR.optional(), align: align.optional(), justify: justify.optional() })
  .strict();

export const flexProps = z
  .object({
    direction: responsive(z.enum(["row", "column", "row-reverse", "column-reverse"])).optional(),
    wrap: responsive(z.boolean()).optional(),
    gap: cssR.optional(),
    align: align.optional(),
    justify: justify.optional(),
  })
  .strict();

export const gridProps = z
  .object({
    /** A count ("3") or a full track list ("1fr 2fr"). */
    columns: responsive(z.string().max(200).refine(isSafeCssValue)).optional(),
    rows: responsive(z.string().max(200).refine(isSafeCssValue)).optional(),
    gap: cssR.optional(),
    align: align.optional(),
    justify: justify.optional(),
  })
  .strict();

export const spacerProps = z.object({ height: cssR.default("16px") }).strict();

export const dividerProps = z
  .object({
    orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
    thickness: css.default("1px"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    color: css.default("token:color.border"),
    spacing: cssR.optional(),
  })
  .strict();

const emptyProps = z.object({}).strict();

export interface ComponentDef {
  type: string;
  label: string;
  category: "layout" | "content";
  props: z.ZodType<Record<string, unknown>>;
  /** Whether the node can contain children. */
  container: boolean;
}

const def = (
  type: string,
  label: string,
  category: ComponentDef["category"],
  props: z.ZodTypeAny,
  container: boolean,
): ComponentDef => ({ type, label, category, props: props as ComponentDef["props"], container });

/** The single source of truth for which node types exist. */
export const COMPONENTS: ComponentDef[] = [
  def("section", "Section", "layout", emptyProps, true),
  def("container", "Container", "layout", emptyProps, true),
  def("stack", "Stack", "layout", stackProps, true),
  def("flex", "Flex", "layout", flexProps, true),
  def("grid", "Grid", "layout", gridProps, true),
  def("spacer", "Spacer", "layout", spacerProps, false),
  def("divider", "Divider", "layout", dividerProps, false),
  def("text", "Text", "content", textProps, false),
  def("richtext", "Rich Text", "content", richTextProps, false),
  def("image", "Image", "content", imageProps, false),
  def("video", "Video", "content", videoProps, false),
  def("icon", "Icon", "content", iconProps, false),
  def("button", "Button", "content", buttonProps, false),
  def("badge", "Badge", "content", badgeProps, false),
];

export const COMPONENT_MAP: Record<string, ComponentDef> = Object.fromEntries(
  COMPONENTS.map((c) => [c.type, c]),
);

export type NodeType = (typeof COMPONENTS)[number]["type"];
