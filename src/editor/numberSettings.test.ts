import { describe, expect, it } from "vitest";
import { fromPuck } from "./adapters/puck";

const save = (type: string, props: Record<string, unknown>) =>
  fromPuck({ root: { props: {} }, content: [{ type, props: { id: "x", ...props } }] } as never);

describe("number settings", () => {
  it.each([
    ["Icon", { name: "star", rotation: 45 }, "rotation"],
    ["Countdown", { mode: "duration", durationMinutes: 30 }, "durationMinutes"],
    ["Repeater", { source: "items", limit: 2, children: [] }, "limit"],
  ])("%s saves its number setting", (type, props, key) => {
    const result = save(type, props);
    expect(result.success && result.data.children[0].props[key]).toBe(props[key as keyof typeof props]);
  });

  it.each([
    ["Icon", { name: "star", rotation: "45" }, "rotation", 45],
    ["Countdown", { mode: "duration", durationMinutes: "30" }, "durationMinutes", 30],
    ["Repeater", { source: "items", limit: "2", children: [] }, "limit", 2],
  ])("%s still loads a number saved as text by older versions", (type, props, key, expected) => {
    const result = save(type, props);
    expect(result.success && result.data.children[0].props[key]).toBe(expected);
  });

  it("still rejects text that isn't a number", () => {
    expect(save("Icon", { name: "star", rotation: "lots" }).success).toBe(false);
  });
});
