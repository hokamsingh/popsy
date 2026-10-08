import { z } from "zod";

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
    name: z.string().regex(/^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/),
    label: z.string().max(100).optional(),
    fields: z.array(z.string().max(64)).max(20).default([]),
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
