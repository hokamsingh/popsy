"use client";
import { createContext, useContext, type CSSProperties, type ElementType, type ReactNode } from "react";
import { mapResponsive, type Responsive } from "@/design-system/responsive";
import { layerCssProps } from "@/design-system/layers";
import { buildCss, type CssProps, type Style } from "@/design-system/styles";
import { useRuntime } from "@/runtime/context";

export type SlotRender = (props: { className?: string; style?: CSSProperties; minEmptyHeight?: number }) => ReactNode;

export interface NodeBaseProps {
  id: string;
  style?: Style;
  children?: ReactNode;
  slot?: SlotRender;
}

const cssSafe = (text: string) => text.replace(/[^A-Za-z0-9_-]/g, "_");

/** The class name of the Layers block that a block sits directly inside, if any. */
export const LayerContext = createContext<string | null>(null);

export const nodeClass = (id: string, scope = "") => `pp-${scope ? `${cssSafe(scope)}-` : ""}${cssSafe(id)}`;

interface FrameProps extends NodeBaseProps {
  as?: ElementType;
  kind: string;
  cssProps?: CssProps;
  attrs?: Record<string, unknown>;
  minEmptyHeight?: number;
  nested?: (selector: string) => string;
  placesChildrenOnLayer?: boolean;
}

export function Frame({ id, as: Tag = "div", kind, cssProps, style, attrs, children, slot, minEmptyHeight, nested, placesChildrenOnLayer = false }: FrameProps) {
  const { scope } = useRuntime();
  const parentLayerClass = useContext(LayerContext);
  const cls = nodeClass(id, scope);
  const placement = parentLayerClass ? layerCssProps(style?.anchor, style?.offsetX, style?.offsetY) : null;
  const gridItemSelector = `.${parentLayerClass} > :is(.${cls}, :has(> .${cls}))`;
  const css =
    buildCss(`.${cls}`, { ...cssProps, ...placement?.self }, style) +
    (placement ? buildCss(gridItemSelector, placement.item) : "") +
    (nested?.(`.${cls}`) ?? "");
  const content = slot ? (
    slot({ className: cls, minEmptyHeight })
  ) : (
    <Tag className={cls} data-pp={kind} {...attrs}>
      {children}
    </Tag>
  );

  return (
    <>
      {css ? <style>{css}</style> : null}
      <LayerContext.Provider value={placesChildrenOnLayer ? cls : null}>{content}</LayerContext.Provider>
    </>
  );
}

const ALIGNMENT_TO_CSS: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  between: "space-between",
  around: "space-around",
};

export const toCssAlignment = (v: Responsive<string> | undefined, table: Record<string, string> = ALIGNMENT_TO_CSS) =>
  mapResponsive(v, (x) => table[x] ?? x);
