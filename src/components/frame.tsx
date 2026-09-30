"use client";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { mapResponsive, type Responsive } from "@/design-system/responsive";
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

export const nodeClass = (id: string, scope = "") => `pp-${scope ? `${cssSafe(scope)}-` : ""}${cssSafe(id)}`;

interface FrameProps extends NodeBaseProps {
  as?: ElementType;
  kind: string;
  cssProps?: CssProps;
  attrs?: Record<string, unknown>;
  minEmptyHeight?: number;
  nested?: (selector: string) => string;
}

export function Frame({ id, as: Tag = "div", kind, cssProps, style, attrs, children, slot, minEmptyHeight, nested }: FrameProps) {
  const { scope } = useRuntime();
  const cls = nodeClass(id, scope);
  const css = buildCss(`.${cls}`, cssProps, style) + (nested?.(`.${cls}`) ?? "");
  return (
    <>
      {css ? <style>{css}</style> : null}
      {slot ? (
        slot({ className: cls, minEmptyHeight })
      ) : (
        <Tag className={cls} data-pp={kind} {...attrs}>
          {children}
        </Tag>
      )}
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
