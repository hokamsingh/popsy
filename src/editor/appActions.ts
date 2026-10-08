import * as z from "zod/mini";

/**
 * Actions the host app says it handles, so designers pick from a list instead of typing names.
 * Set NEXT_PUBLIC_POPSY_APP_ACTIONS to JSON like
 * `[{"name":"avail","label":"Avail offer","fields":["id"]}]`. Optional: without it, names are typed.
 */
export interface AppAction {
  name: string;
  label: string;
  fields: string[];
}

const manifestSchema = z.array(
  z.object({
    name: z.string().check(z.regex(/^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/)),
    label: z.optional(z.string().check(z.maxLength(100))),
    fields: z._default(z.array(z.string().check(z.maxLength(64))).check(z.maxLength(20)), () => []),
  }),
);

export function parseAppActions(raw: string | undefined): AppAction[] {
  if (!raw) return [];
  try {
    const parsed = manifestSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.map((a) => ({ ...a, label: a.label ?? a.name })) : [];
  } catch {
    return [];
  }
}

export const APP_ACTIONS = parseAppActions(process.env.NEXT_PUBLIC_POPSY_APP_ACTIONS);
