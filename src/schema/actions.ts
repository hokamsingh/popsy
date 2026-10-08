import * as z from "zod/mini";
import { isSafeLinkUrl } from "./validation";

/** `stay` keeps the popup open; `close` dismisses it. */
export const EVENT_SUCCESS_BEHAVIORS = ["stay", "close"] as const;

const safeLink = z.string().check(z.minLength(1), z.refine(isSafeLinkUrl, "unsafe or invalid URL"));
const shortText = z.string().check(z.maxLength(200));

export const actionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("dismiss") }),
  z.strictObject({
    type: z.literal("navigate"),
    to: safeLink,
  }),
  z.strictObject({
    type: z.literal("external_url"),
    url: safeLink,
    newTab: z.optional(z.boolean()),
  }),
  z.strictObject({
    type: z.literal("event"),
    name: z.string().check(z.regex(/^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/, "invalid event name")),
    payload: z.optional(z.record(z.string(), z.unknown())),
    /** What happens once the app reports the action succeeded. */
    onSuccess: z.optional(z.enum(EVENT_SUCCESS_BEHAVIORS)),
    successMessage: z.optional(shortText),
    /** Shown on the button when the app reports the action failed. */
    errorMessage: z.optional(shortText),
  }),
]);

export type Action = z.infer<typeof actionSchema>;
export type ActionType = Action["type"];
