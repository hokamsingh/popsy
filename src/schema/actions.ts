import { z } from "zod";
import { isSafeLinkUrl } from "./validation";

/** `stay` keeps the popup open; `close` dismisses it. */
export const EVENT_SUCCESS_BEHAVIORS = ["stay", "close"] as const;

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
      /** What happens once the app reports the action succeeded. */
      onSuccess: z.enum(EVENT_SUCCESS_BEHAVIORS).optional(),
      successMessage: z.string().max(200).optional(),
      /** Shown on the button when the app reports the action failed. */
      errorMessage: z.string().max(200).optional(),
    })
    .strict(),
]);

export type Action = z.infer<typeof actionSchema>;
export type ActionType = Action["type"];
