import { z } from "zod";
import { isTokenName } from "@/design-system/tokens";
import { NODE_ID } from "./validation";
import { COMPONENT_MAP } from "./components";
import { cssValue as css, styleSchema, type Style } from "@/design-system/styles";
import { CURRENT_VERSION, migratePopup } from "./migrations";

export { CURRENT_VERSION };

export const POSITIONS = [
  "center", "top", "bottom", "left", "right",
  "top-left", "top-right", "bottom-left", "bottom-right",
] as const;
export const ANIMATIONS = ["none", "fade", "scale", "slide-up", "slide-down"] as const;

export const settingsSchema = z
  .object({
    title: z.string().max(200).default("Popup"),
    width: css.default("480px"),
    maxWidth: css.default("calc(100vw - 32px)"),
    height: css.default("auto"),
    maxHeight: css.default("calc(100vh - 32px)"),
    position: z.enum(POSITIONS).default("center"),
    overlay: z.boolean().default(true),
    overlayColor: css.default("rgba(15,23,42,0.55)"),
    overlayBlur: css.optional(),
    closeButtonColor: css.optional(),
    background: css.default("token:color.background"),
    radius: css.default("token:radius.lg"),
    shadow: css.default("token:shadow.lg"),
    animation: z.enum(ANIMATIONS).default("scale"),
    closeOnEscape: z.boolean().default(true),
    closeOnOverlayClick: z.boolean().default(true),
    showCloseButton: z.boolean().default(true),
    lockScroll: z.boolean().default(true),
    zIndex: z.number().int().min(0).max(2147483647).default(1000),
    tokens: z
      .record(z.string().refine(isTokenName, "invalid token name"), css)
      .default({}),
  })
  .strict();

export type PopupSettings = z.infer<typeof settingsSchema>;

export interface PopupNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Style;
  children?: PopupNode[];
}

const nodeShape: z.ZodType<PopupNode> = z.lazy(() =>
  z
    .object({
      id: z.string().regex(NODE_ID, "invalid node id"),
      type: z.string(),
      props: z.record(z.string(), z.unknown()).default({}),
      style: styleSchema.optional(),
      children: z.array(nodeShape).optional(),
    })
    .strict(),
) as z.ZodType<PopupNode>;

export const popupSchema = z
  .object({
    version: z.number().int().min(1),
    type: z.literal("popup"),
    meta: z
      .object({ name: z.string().max(200).optional(), description: z.string().max(1000).optional() })
      .passthrough()
      .optional(),
    settings: settingsSchema.default(() => settingsSchema.parse({})),
    children: z.array(nodeShape).default([]),
  })
  .strict();

export interface Popup {
  version: number;
  type: "popup";
  meta?: { name?: string; description?: string; [k: string]: unknown };
  settings: PopupSettings;
  children: PopupNode[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ParseResult =
  | { success: true; data: Popup }
  | { success: false; errors: ValidationIssue[] };

const fmtPath = (path: ReadonlyArray<PropertyKey>) =>
  path.reduce<string>((acc, p) => (typeof p === "number" ? `${acc}[${p}]` : acc ? `${acc}.${String(p)}` : String(p)), "");

export function parsePopup(input: unknown): ParseResult {
  const migrated = migratePopup(input);
  if (!migrated.success) return migrated;
  const base = popupSchema.safeParse(migrated.data);
  if (!base.success) {
    return {
      success: false,
      errors: base.error.issues.map((i) => ({ path: fmtPath(i.path), message: i.message })),
    };
  }
  const popup = base.data as Popup;
  const errors: ValidationIssue[] = [];
  const seen = new Set<string>();

  const visit = (nodes: PopupNode[], path: string): PopupNode[] =>
    nodes.map((node, i) => {
      const here = `${path}[${i}]`;
      if (seen.has(node.id)) errors.push({ path: `${here}.id`, message: `duplicate id "${node.id}"` });
      seen.add(node.id);

      const def = COMPONENT_MAP[node.type];
      if (!def) {
        errors.push({ path: `${here}.type`, message: `unknown component type "${node.type}"` });
        return node;
      }
      const props = def.props.safeParse(node.props);
      let nextProps = node.props;
      if (props.success) nextProps = props.data;
      else {
        for (const issue of props.error.issues) {
          const sub = fmtPath(issue.path);
          errors.push({ path: sub ? `${here}.props.${sub}` : `${here}.props`, message: issue.message });
        }
      }
      if (node.children?.length && !def.container) {
        errors.push({ path: `${here}.children`, message: `"${node.type}" cannot have children` });
      }
      const children = node.children ? visit(node.children, `${here}.children`) : undefined;
      return { ...node, props: nextProps, ...(children ? { children } : {}) };
    });

  const children = visit(popup.children, "children");
  if (errors.length) return { success: false, errors };
  return { success: true, data: { ...popup, children } };
}

export function createEmptyPopup(name = "Untitled popup"): Popup {
  return {
    version: CURRENT_VERSION,
    type: "popup",
    meta: { name },
    settings: settingsSchema.parse({}),
    children: [],
  };
}
