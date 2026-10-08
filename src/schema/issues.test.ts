import { describe, expect, it } from "vitest";
import { createEmptyPopup, parsePopup } from "./popup";

const errorsFor = (children: unknown[], extra: Record<string, unknown> = {}) => {
  const result = parsePopup({ ...createEmptyPopup(), ...extra, children });
  return result.success ? [] : result.errors.map((e) => `${e.path}: ${e.message}`);
};

describe("validation messages", () => {
  it("describe problems in plain words, never a bare 'Invalid input'", () => {
    const errors = [
      ...errorsFor([{ id: "a", type: "icon", props: { name: "star", rotation: "lots" } }]),
      ...errorsFor([{ id: "b", type: "button", props: { variant: "huge" } }]),
      ...errorsFor([{ id: "c", type: "badge", props: { text: "x", colour: "red" } }]),
      ...errorsFor([{ id: "d", type: "text", props: { content: "x".repeat(5001) } }]),
      ...errorsFor([], { version: "one" }),
    ];
    expect(errors).toEqual([
      "children[0].props.rotation: expected number, received string",
      'children[0].props.variant: expected one of "solid", "outline", "ghost", "link"',
      "children[0].props: unknown setting: colour",
      "children[0].props.content: must be at most 5000 characters",
      "version: version must be a positive integer",
    ]);
  });

  it("keeps the custom messages written for specific rules", () => {
    expect(errorsFor([{ id: "e", type: "image", props: { src: "javascript:alert(1)" } }])).toEqual(["children[0].props.src: unsafe or invalid URL"]);
  });

  it("fills nested defaults when parts are missing", () => {
    const result = parsePopup({ version: 1, type: "popup" });
    expect(result.success && result.data.settings.width).toBe("480px");
    expect(result.success && result.data.variables).toEqual([]);
  });
});
