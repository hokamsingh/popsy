import type { ComponentData } from "@puckeditor/core";

type Item = ComponentData<Record<string, unknown> & { id: string }>;

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Wraps any block in a Layers block and adds a badge in its top-left corner.
 * The editor only lets a block be replaced by one with the same id, so the new Layers
 * block takes the original's id and the original moves inside with a new one.
 */
export function putBadgeOnBlock(block: Item, createId: (prefix: string) => string = randomId): Item {
  const badgeId = createId("badge");
  const fillTheLayer = { ...(block.props.style as object | undefined), anchor: "fill" };

  const badge: Item = {
    type: "Badge",
    props: {
      id: badgeId,
      text: "New",
      variant: "solid",
      size: "md",
      style: { anchor: "top-left", offsetX: "12px", offsetY: "12px" },
    },
  };

  return {
    type: "Layers",
    props: {
      id: block.props.id,
      height: "auto",
      style: {},
      children: [{ ...block, props: { ...block.props, id: createId("content"), style: fillTheLayer } }, badge],
    },
  };
}
