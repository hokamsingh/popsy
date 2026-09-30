import { z } from "zod";
import { isSafeLinkUrl } from "./validation";

/**
 * Actions are data. The builder never knows what "claim_bonus" means: it only
 * emits `{type:"event", name:"claim_bonus"}` and the host application decides.
 */
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("dismiss") }).strict(),
  z
    .object({
      type: z.literal("navigate"),
      to: z.string().min(1).refine(isSafeLinkUrl, "unsafe or invalid URL"),
    })
    .strict(),
  z
    .object({
      type: z.literal("external_url"),
      url: z.string().min(1).refine(isSafeLinkUrl, "unsafe or invalid URL"),
      newTab: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("event"),
      name: z.string().regex(/^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/, "invalid event name"),
      payload: z.record(z.string(), z.unknown()).optional(),
    })
    .strict(),
]);

export type Action = z.infer<typeof actionSchema>;
export type ActionType = Action["type"];
export const ACTION_TYPES: ActionType[] = ["dismiss", "navigate", "external_url", "event"];
