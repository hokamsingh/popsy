import type { CSSProperties, ElementType, ReactNode } from "react";
import { buildCss, type Decls, type Style } from "@/design-system/styles";

/** Puck renders slot children through a component that accepts className/style. */
export type SlotRender = (props: { className?: string; style?: CSSProperties; minEmptyHeight?: number }) => ReactNode;

export interface NodeBaseProps {
  id: string;
  style?: Style;
  children?: ReactNode;
  /** Editor-only: renders the container element itself so Puck can attach its drop zone. */
  slot?: SlotRender;
}

export const nodeClass = (id: string) => `pp-${id.replace(/[^A-Za-z0-9_-]/g, "_")}`;

interface FrameProps extends NodeBaseProps {
  as?: ElementType;
  kind: string;
  decls?: Decls;
  attrs?: Record<string, unknown>;
  /** Minimum height for empty containers when rendered by the editor. */
  minEmptyHeight?: number;
}

/**
 * Every primitive renders through Frame: one scoped class per node, one generated
 * stylesheet (base + responsive overrides), shared by the runtime and the editor.
 */
export function Frame({ id, as: Tag = "div", kind, decls, style, attrs, children, slot, minEmptyHeight }: FrameProps) {
  const cls = nodeClass(id);
  const css = buildCss(`.${cls}`, decls, style);
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

const ALIGN: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  between: "space-between",
  around: "space-around",
};

type R<T> = T | Partial<Record<"desktop" | "tablet" | "mobile", T>>;

/** Applies `fn` to a plain or per-breakpoint value. */
export function mapR<T, U>(v: R<T> | undefined, fn: (x: T) => U): R<U> | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "object" && v !== null) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fn(x as T)])) as R<U>;
  }
  return fn(v as T);
}

/** Maps a (possibly responsive) enum value through a lookup table. */
export const mapEnum = (v: R<string> | undefined, table: Record<string, string> = ALIGN) =>
  mapR(v, (x) => table[x] ?? x);
