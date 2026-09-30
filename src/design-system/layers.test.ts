import { describe, expect, it } from "vitest";
import { ANCHORS, layerCssProps, layerPlacement } from "./layers";
import { buildCss } from "./styles";

describe("layerPlacement", () => {
  it("aligns a corner inside the shared cell and measures offsets from the edges", () => {
    const topLeft = layerPlacement("top-left", "12px", "8px");
    expect(topLeft.item).toMatchObject({ "grid-area": "1 / 1", "justify-self": "start", "align-self": "start" });
    expect(topLeft.self.margin).toBe("8px 0px 0px 12px");

    const bottomRight = layerPlacement("bottom-right", "12px", "8px");
    expect(bottomRight.item).toMatchObject({ "justify-self": "end", "align-self": "end" });
    expect(bottomRight.self.margin).toBe("0px 12px 8px 0px");
  });

  it("centres and nudges from the middle", () => {
    const center = layerPlacement("center", "10px", "-6px");
    expect(center.item).toMatchObject({ "justify-self": "center", "align-self": "center" });
    expect(center.self.transform).toBe("translate(10px, -6px)");
  });

  it("fills the whole cell, inset by the offsets", () => {
    const fill = layerPlacement("fill", "4px", "6px");
    expect(fill.item).toMatchObject({ "justify-self": "stretch", "align-self": "stretch" });
    expect(fill.self).toMatchObject({ margin: "6px 4px", width: "calc(100% - 4px * 2)", height: "calc(100% - 6px * 2)" });
  });

  it("sets the same properties for every anchor so nothing goes stale", () => {
    const base = layerPlacement("fill");
    for (const anchor of ANCHORS) {
      const placement = layerPlacement(anchor);
      expect(Object.keys(placement.item).sort()).toEqual(Object.keys(base.item).sort());
      expect(Object.keys(placement.self).sort()).toEqual(Object.keys(base.self).sort());
    }
  });
});

describe("layerCssProps", () => {
  it("defaults to the centre", () => {
    expect(layerCssProps(undefined).item["justify-self"]).toEqual({ desktop: "center" });
  });

  it("changes anchor per device", () => {
    const { item } = layerCssProps({ desktop: "top-left", mobile: "bottom" });
    const css = buildCss(".x", item);
    expect(css).toContain(".x{grid-area:1 / 1;min-width:0;justify-self:start;align-self:start}");
    expect(css).toContain("@media (max-width: 640px){.x{grid-area:1 / 1;min-width:0;justify-self:center;align-self:end}}");
  });
});
