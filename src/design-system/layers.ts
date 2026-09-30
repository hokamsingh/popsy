import { BREAKPOINTS, expandResponsive, type Responsive, type ResponsiveObject } from "./responsive";

export const ANCHORS = [
  "fill",
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
] as const;
export type Anchor = (typeof ANCHORS)[number];

type Horizontal = "left" | "center" | "right";
type Vertical = "top" | "middle" | "bottom";

const ANCHOR_SIDES: Record<Exclude<Anchor, "fill">, [Horizontal, Vertical]> = {
  "top-left": ["left", "top"],
  top: ["center", "top"],
  "top-right": ["right", "top"],
  left: ["left", "middle"],
  center: ["center", "middle"],
  right: ["right", "middle"],
  "bottom-left": ["left", "bottom"],
  bottom: ["center", "bottom"],
  "bottom-right": ["right", "bottom"],
};

const GRID_ALIGNMENT = { left: "start", center: "center", right: "end", top: "start", middle: "center", bottom: "end" } as const;

const DEFAULT_ANCHOR: Anchor = "center";

export interface LayerPlacement {
  /** Aligns the block inside the shared grid cell. Applies to the grid item itself. */
  item: Record<string, string>;
  /** Margins and sizing on the block's own element. */
  self: Record<string, string>;
}

/**
 * Layers share a single grid cell. Every anchor writes every property, so switching
 * anchor on another device never leaves a value behind from the previous one.
 */
export function layerPlacement(anchor: Anchor, offsetX = "0px", offsetY = "0px"): LayerPlacement {
  const cell = { "grid-area": "1 / 1", "min-width": "0" };

  if (anchor === "fill") {
    return {
      item: { ...cell, "justify-self": "stretch", "align-self": "stretch" },
      self: {
        margin: `${offsetY} ${offsetX}`,
        transform: "none",
        width: `calc(100% - ${offsetX} * 2)`,
        height: `calc(100% - ${offsetY} * 2)`,
        "max-width": "none",
      },
    };
  }

  const [horizontal, vertical] = ANCHOR_SIDES[anchor];
  const top = vertical === "top" ? offsetY : "0px";
  const bottom = vertical === "bottom" ? offsetY : "0px";
  const left = horizontal === "left" ? offsetX : "0px";
  const right = horizontal === "right" ? offsetX : "0px";
  const nudgeX = horizontal === "center" ? offsetX : "0px";
  const nudgeY = vertical === "middle" ? offsetY : "0px";

  return {
    item: { ...cell, "justify-self": GRID_ALIGNMENT[horizontal], "align-self": GRID_ALIGNMENT[vertical] },
    self: {
      margin: `${top} ${right} ${bottom} ${left}`,
      transform: `translate(${nudgeX}, ${nudgeY})`,
      width: "auto",
      height: "auto",
      "max-width": "100%",
    },
  };
}

const firstValue = (value: Responsive<string> | undefined) => expandResponsive(value).desktop;

type PerDeviceProps = Record<string, ResponsiveObject<string>>;

/** The same placement, expanded per device so each device can use its own anchor. */
export function layerCssProps(anchor: Responsive<Anchor> | undefined, offsetX?: Responsive<string>, offsetY?: Responsive<string>) {
  const anchorsByDevice = expandResponsive(anchor ?? DEFAULT_ANCHOR);
  const item: PerDeviceProps = {};
  const self: PerDeviceProps = {};

  for (const device of BREAKPOINTS) {
    const deviceAnchor = anchorsByDevice[device];
    if (!deviceAnchor) continue;
    const placement = layerPlacement(deviceAnchor, firstValue(offsetX), firstValue(offsetY));
    for (const [property, value] of Object.entries(placement.item)) (item[property] ??= {})[device] = value;
    for (const [property, value] of Object.entries(placement.self)) (self[property] ??= {})[device] = value;
  }
  return { item, self };
}
