import * as z from "zod/mini";
import { describeIssue } from "./issues";
import { isTokenName } from "@/design-system/tokens";
import { DECLARED_VARIABLE_NAME, NODE_ID } from "./validation";
import { COMPONENT_MAP } from "./components";
import { cssValue as css, styleSchema, type Style } from "@/design-system/styles";
import { CURRENT_VERSION, migratePopup } from "./migrations";

export { CURRENT_VERSION };

export const POSITIONS = [
  "center", "top", "bottom", "left", "right",
  "top-left", "top-right", "bottom-left", "bottom-right",
] as const;
export const ANIMATIONS = ["none", "fade", "scale", "slide-up", "slide-down"] as const;

export const settingsSchema = z.strictObject({
  title: z._default(z.string().check(z.maxLength(200)), "Popup"),
  width: z._default(css, "480px"),
  maxWidth: z._default(css, "calc(100vw - 32px)"),
  height: z._default(css, "auto"),
  maxHeight: z._default(css, "calc(100vh - 32px)"),
  position: z._default(z.enum(POSITIONS), "center"),
  overlay: z._default(z.boolean(), true),
  overlayColor: z._default(css, "rgba(15,23,42,0.55)"),
  overlayBlur: z.optional(css),
  closeButtonColor: z.optional(css),
  background: z._default(css, "token:color.background"),
  radius: z._default(css, "token:radius.lg"),
  shadow: z._default(css, "token:shadow.lg"),
  animation: z._default(z.enum(ANIMATIONS), "scale"),
  closeOnEscape: z._default(z.boolean(), true),
  closeOnOverlayClick: z._default(z.boolean(), true),
  showCloseButton: z._default(z.boolean(), true),
  lockScroll: z._default(z.boolean(), true),
  zIndex: z._default(z.int().check(z.gte(0), z.lte(2147483647)), 1000),
  tokens: z._default(z.record(z.string().check(z.refine(isTokenName, "invalid token name")), css), () => ({})),
});

export type PopupSettings = z.infer<typeof settingsSchema>;

export const MAX_VARIABLES = 50;
export const MAX_LIST_SAMPLE = 50;

/** A value the host page can fill in wherever the popup says `{{name}}`. */
export const variableSchema = z.strictObject({
  name: z.string().check(z.regex(DECLARED_VARIABLE_NAME, "use letters, numbers and _ only, starting with a letter (dots reach into nested values)")),
  defaultValue: z._default(z.string().check(z.maxLength(1000)), ""),
  /** Makes this a list variable: sample items shown in the editor and used when the website sends no list. */
  sample: z.optional(z.array(z.unknown()).check(z.maxLength(MAX_LIST_SAMPLE))),
});

export type PopupVariable = z.infer<typeof variableSchema>;

export interface PopupNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Style;
  children?: PopupNode[];
}

const nodeShape: z.ZodMiniType<PopupNode> = z.lazy(() =>
  z.strictObject({
    id: z.string().check(z.regex(NODE_ID, "invalid node id")),
    type: z.string(),
    props: z._default(z.record(z.string(), z.unknown()), () => ({})),
    style: z.optional(styleSchema),
    children: z.optional(z.array(nodeShape)),
  }),
) as unknown as z.ZodMiniType<PopupNode>;

export const popupSchema = z.strictObject({
  version: z.int().check(z.gte(1)),
  type: z.literal("popup"),
  meta: z.optional(
    z.looseObject({ name: z.optional(z.string().check(z.maxLength(200))), description: z.optional(z.string().check(z.maxLength(1000))) }),
  ),
  settings: z._default(settingsSchema, () => settingsSchema.parse({})),
  variables: z._default(z.array(variableSchema).check(z.maxLength(MAX_VARIABLES)), () => []),
  children: z._default(z.array(nodeShape), () => []),
});

export interface Popup {
  version: number;
  type: "popup";
  meta?: { name?: string; description?: string; [k: string]: unknown };
  settings: PopupSettings;
  variables: PopupVariable[];
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

/** Keeps the offending value on each issue so messages can say what was received. */
const REPORT_INPUT = { reportInput: true } as const;

export function parsePopup(input: unknown): ParseResult {
  const migrated = migratePopup(input);
  if (!migrated.success) return migrated;
  const base = popupSchema.safeParse(migrated.data, REPORT_INPUT);
  if (!base.success) {
    return {
      success: false,
      errors: base.error.issues.map((i) => ({ path: fmtPath(i.path), message: describeIssue(i) })),
    };
  }
  const popup = base.data as Popup;
  const errors: ValidationIssue[] = [];
  const seen = new Set<string>();

  const names = new Set<string>();
  popup.variables.forEach((variable, i) => {
    if (names.has(variable.name)) errors.push({ path: `variables[${i}].name`, message: `duplicate variable "${variable.name}"` });
    names.add(variable.name);
  });

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
      const props = def.props.safeParse(node.props, REPORT_INPUT);
      let nextProps = node.props;
      if (props.success) nextProps = props.data;
      else {
        for (const issue of props.error.issues) {
          const sub = fmtPath(issue.path);
          errors.push({ path: sub ? `${here}.props.${sub}` : `${here}.props`, message: describeIssue(issue) });
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
    variables: [],
    children: [],
  };
}
