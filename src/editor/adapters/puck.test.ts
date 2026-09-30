import { describe, expect, it } from "vitest";
import { fromPuck, nodeFromPuck, toPuck, type PuckData } from "./puck";
import { parsePopup } from "@/schema/popup";
import { BENCHMARKS } from "@/templates/benchmarks";

describe("puck adapter", () => {
  it.each(Object.entries(BENCHMARKS))("round-trips %s losslessly", (_, make) => {
    const canonical = parsePopup(make());
    if (!canonical.success) throw new Error("fixture invalid");
    const back = fromPuck(toPuck(canonical.data));
    if (!back.success) throw new Error(JSON.stringify(back.errors));
    expect(back.data).toEqual(canonical.data);
  });

  it("maps canonical types to Puck component keys and nests children as slots", () => {
    const c = parsePopup(BENCHMARKS["two-column-promotion"]());
    if (!c.success) throw new Error();
    const data = toPuck(c.data);
    expect(data.content[0].type).toBe("Section");
    const grid = (data.content[0].props.children as { type: string; props: Record<string, unknown> }[])[0];
    expect(grid.type).toBe("Grid");
    expect(Array.isArray(grid.props.children)).toBe(true);
  });

  it("cleans editor leftovers: empty strings, empty style objects, lone desktop values", () => {
    const node = nodeFromPuck({
      type: "Button",
      props: { id: "b", label: "Go", icon: "", style: { padding: { desktop: "8px", tablet: "", mobile: "" }, color: "" } },
    });
    expect(node.props).toEqual({ label: "Go" });
    expect(node.style).toEqual({ padding: "8px" });
  });

  it("keeps intentionally empty content/alt", () => {
    const node = nodeFromPuck({ type: "Text", props: { id: "t", content: "", style: {} } });
    expect(node.props).toEqual({ content: "" });
  });

  it("surfaces validation errors instead of producing an invalid popup", () => {
    const data: PuckData = {
      root: { props: {} },
      content: [{ type: "Image", props: { id: "i", src: "javascript:alert(1)", style: {} } }],
    };
    const r = fromPuck(data);
    expect(r.success).toBe(false);
  });

  it("reads popup settings and name from root props", () => {
    const r = fromPuck({ root: { props: { name: "Hello", width: "600px", position: "top" } }, content: [] });
    if (!r.success) throw new Error();
    expect(r.data.meta?.name).toBe("Hello");
    expect(r.data.settings).toMatchObject({ width: "600px", position: "top" });
  });
});
