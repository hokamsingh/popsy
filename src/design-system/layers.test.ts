import { describe, expect, it } from "vitest";
import { ANCHORS, layerCssProps, layerPlacement, offsetsFromCenterPoint, topLeftPoint } from "./layers";
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

describe("free-form positions", () => {
  const layer = { width: 400, height: 300 };
  const block = { width: 80, height: 28 };

  it("finds the top-left corner for every kind of anchor", () => {
    expect(topLeftPoint("top-left", 12, 8, layer, block)).toEqual({ x: 12, y: 8 });
    expect(topLeftPoint("bottom-right", 10, 10, layer, block)).toEqual({ x: 310, y: 262 });
    expect(topLeftPoint("center", 0, 0, layer, block)).toEqual({ x: 160, y: 136 });
    expect(topLeftPoint("fill", 5, 6, layer, block)).toEqual({ x: 5, y: 6 });
  });

  it("turns a dragged spot into offsets centred on the pointer", () => {
    expect(offsetsFromCenterPoint({ x: 200, y: 150 }, layer, block)).toEqual({ x: 160, y: 136 });
  });

  it("keeps the block inside the layer", () => {
    expect(offsetsFromCenterPoint({ x: -50, y: -50 }, layer, block)).toEqual({ x: 0, y: 0 });
    expect(offsetsFromCenterPoint({ x: 999, y: 999 }, layer, block)).toEqual({ x: 320, y: 272 });
  });

  it("round-trips: dragging to a spot and reading it back gives the same spot", () => {
    const { x, y } = offsetsFromCenterPoint({ x: 123, y: 77 }, layer, block);
    expect(topLeftPoint("top-left", x, y, layer, block)).toEqual({ x, y });
  });
});

