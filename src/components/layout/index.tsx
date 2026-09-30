import { Frame, mapEnum, mapR, type NodeBaseProps } from "../frame";
import type { Responsive } from "@/design-system/responsive";

type Align = Responsive<"start" | "center" | "end" | "stretch">;
type Justify = Responsive<"start" | "center" | "end" | "between" | "around">;
type Css = Responsive<string>;

export function Section(p: NodeBaseProps) {
  return (
    <Frame
      {...p}
      as="section"
      kind="section"
      minEmptyHeight={48}
      decls={{ width: "100%", position: "relative", "box-sizing": "border-box" }}
    />
  );
}

export function Container(p: NodeBaseProps) {
  return (
    <Frame
      {...p}
      kind="container"
      minEmptyHeight={48}
      decls={{ width: "100%", "margin-left": "auto", "margin-right": "auto", "box-sizing": "border-box" }}
    />
  );
}

export function Stack({ gap, align, justify, ...p }: NodeBaseProps & { gap?: Css; align?: Align; justify?: Justify }) {
  return (
    <Frame
      {...p}
      kind="stack"
      minEmptyHeight={48}
      decls={{
        display: "flex",
        "flex-direction": "column",
        gap,
        "align-items": mapEnum(align),
        "justify-content": mapEnum(justify),
      }}
    />
  );
}

export function Flex({
  direction,
  wrap,
  gap,
  align,
  justify,
  ...p
}: NodeBaseProps & {
  direction?: Responsive<"row" | "column" | "row-reverse" | "column-reverse">;
  wrap?: Responsive<boolean>;
  gap?: Css;
  align?: Align;
  justify?: Justify;
}) {
  return (
    <Frame
      {...p}
      kind="flex"
      minEmptyHeight={48}
      decls={{
        display: "flex",
        "flex-direction": direction,
        "flex-wrap": mapR(wrap, (w) => (w ? "wrap" : "nowrap")),
        gap,
        "align-items": mapEnum(align),
        "justify-content": mapEnum(justify),
      }}
    />
  );
}

/** "3" → repeat(3, minmax(0, 1fr)); anything else is used as a track list. */
const tracks = (v: string) => (/^\d+$/.test(v.trim()) ? `repeat(${v.trim()}, minmax(0, 1fr))` : v);

export function Grid({
  columns,
  rows,
  gap,
  align,
  justify,
  ...p
}: NodeBaseProps & { columns?: Responsive<string>; rows?: Responsive<string>; gap?: Css; align?: Align; justify?: Justify }) {
  return (
    <Frame
      {...p}
      kind="grid"
      minEmptyHeight={48}
      decls={{
        display: "grid",
        "grid-template-columns": mapR(columns, tracks),
        "grid-template-rows": mapR(rows, tracks),
        gap,
        "align-items": mapEnum(align),
        "justify-items": mapEnum(justify, { start: "start", center: "center", end: "end", stretch: "stretch" }),
      }}
    />
  );
}

export function Spacer({ height, ...p }: NodeBaseProps & { height?: Css }) {
  return <Frame {...p} kind="spacer" attrs={{ "aria-hidden": true }} decls={{ height: height ?? "16px", width: "100%", "flex-shrink": "0" }} />;
}

export function Divider({
  orientation = "horizontal",
  thickness = "1px",
  style: lineStyle = "solid",
  color = "token:color.border",
  spacing,
  ...p
}: NodeBaseProps & {
  orientation?: "horizontal" | "vertical";
  thickness?: string;
  style?: "solid" | "dashed" | "dotted";
  color?: string;
  spacing?: Css;
}) {
  const vertical = orientation === "vertical";
  return (
    <Frame
      {...p}
      as="hr"
      kind="divider"
      attrs={{ role: "separator", "aria-orientation": orientation }}
      decls={{
        border: "0",
        [vertical ? "border-left" : "border-top"]: `${thickness} ${lineStyle} ${color}`,
        margin: mapR(spacing, (x) => `${x} 0`) ?? "0",
        "align-self": vertical ? "stretch" : undefined,
        width: vertical ? "0" : "100%",
        "box-sizing": "border-box",
      }}
    />
  );
}
