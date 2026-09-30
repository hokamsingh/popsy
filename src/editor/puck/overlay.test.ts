import { describe, expect, it } from "vitest";
import { putBadgeOnBlock } from "./overlay";
import { nodeFromPuck } from "../adapters/puck";
import { parsePopup } from "@/schema/popup";

const image = { type: "Image", props: { id: "photo", src: "https://example.com/a.jpg", alt: "", style: { width: "100%" } } };
const ids = (prefix: string) => `${prefix}-x`;

describe("putBadgeOnBlock", () => {
  it("wraps the block in Layers, filling it, with a badge in the top-left corner after it", () => {
    const layers = putBadgeOnBlock(image, ids);
    const [wrapped, badge] = layers.props.children as typeof image[];
    expect(layers.type).toBe("Layers");
    expect(layers.props.id).toBe("photo");
    expect(wrapped.props.id).toBe("content-x");
    expect(wrapped.props.style).toEqual({ width: "100%", anchor: "fill" });
    expect(badge.props).toMatchObject({ id: "badge-x", text: "New", style: { anchor: "top-left", offsetX: "12px", offsetY: "12px" } });
  });

  it("works for any kind of block", () => {
    const button = { type: "Button", props: { id: "go", label: "Go", style: {} } };
    const [wrapped] = putBadgeOnBlock(button, ids).props.children as (typeof button)[];
    expect(wrapped.type).toBe("Button");
    expect(wrapped.props.style).toEqual({ anchor: "fill" });
  });

  it("does not change the original block", () => {
    putBadgeOnBlock(image, ids);
    expect(image.props.style).toEqual({ width: "100%" });
  });

  it("produces a valid popup once converted back", () => {
    const layers = putBadgeOnBlock(image);
    const node = nodeFromPuck(layers as never);
    const result = parsePopup({ version: 1, type: "popup", children: [node] });
    if (!result.success) throw new Error(JSON.stringify(result.errors));
    expect(result.success).toBe(true);
  });
});
