import type * as z from "zod/mini";

const typeOf = (input: unknown) => (input === null ? "null" : Array.isArray(input) ? "array" : typeof input);
const list = (values: readonly unknown[]) => values.map((v) => JSON.stringify(v)).join(", ");

/**
 * A readable message for a validation problem. The slim zod build used by the renderer carries no
 * message catalogue, so issues without a custom message are described here from their code.
 */
export function describeIssue(issue: z.core.$ZodIssue): string {
  if (issue.message && issue.message !== "Invalid input") return issue.message;
  switch (issue.code) {
    case "invalid_type":
      return "input" in issue ? `expected ${issue.expected}, received ${typeOf(issue.input)}` : `expected ${issue.expected}`;
    case "invalid_value":
      return issue.values.length === 1 ? `expected ${list(issue.values)}` : `expected one of ${list(issue.values)}`;
    case "too_big":
      return `must be at most ${String(issue.maximum)}${issue.origin === "string" ? " characters" : issue.origin === "array" ? " items" : ""}`;
    case "too_small":
      return `must be at least ${String(issue.minimum)}${issue.origin === "string" ? " characters" : issue.origin === "array" ? " items" : ""}`;
    case "unrecognized_keys":
      return `unknown setting${issue.keys.length > 1 ? "s" : ""}: ${issue.keys.join(", ")}`;
    case "invalid_format":
      return issue.format === "datetime" ? "expected a date and time" : `expected ${issue.format} format`;
    case "invalid_union":
      return "doesn't match any allowed shape";
    case "invalid_key":
      return "invalid key";
    case "invalid_element":
      return "invalid entry";
    case "not_multiple_of":
      return `must be a multiple of ${String(issue.divisor)}`;
    default:
      return "invalid value";
  }
}
