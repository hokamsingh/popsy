import { Frame, toCssAlignment, type NodeBaseProps } from "../frame";
import { mapResponsive, type Responsive } from "@/design-system/responsive";

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
      cssProps={{ width: "100%", position: "relative", "box-sizing": "border-box" }}
    />
  );
}

export function Container(p: NodeBaseProps) {
  return (
    <Frame
      {...p}
      kind="container"
      minEmptyHeight={48}
      cssProps={{ width: "100%", "margin-left": "auto", "margin-right": "auto", "box-sizing": "border-box" }}
    />
  );
}

export function Stack({ gap, align, justify, ...p }: NodeBaseProps & { gap?: Css; align?: Align; justify?: Justify }) {
  return (
    <Frame
      {...p}
      kind="stack"
      minEmptyHeight={48}
      cssProps={{
        display: "flex",
        "flex-direction": "column",
        gap,
        "align-items": toCssAlignment(align),
        "justify-content": toCssAlignment(justify),
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
      cssProps={{
        display: "flex",
        "flex-direction": direction,
        "flex-wrap": mapResponsive(wrap, (w) => (w ? "wrap" : "nowrap")),
        gap,
        "align-items": toCssAlignment(align),
        "justify-content": toCssAlignment(justify),
      }}
    />
  );
}

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
      cssProps={{
        display: "grid",
        "grid-template-columns": mapResponsive(columns, tracks),
        "grid-template-rows": mapResponsive(rows, tracks),
        gap,
        "align-items": toCssAlignment(align),
        "justify-items": justify,
      }}
    />
  );
}

export function Spacer({ height, ...p }: NodeBaseProps & { height?: Css }) {
  return <Frame {...p} kind="spacer" attrs={{ "aria-hidden": true }} cssProps={{ height: height ?? "16px", width: "100%", "flex-shrink": "0" }} />;
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
      cssProps={{
        border: "0",
        [vertical ? "border-left" : "border-top"]: `${thickness} ${lineStyle} ${color}`,
        margin: mapResponsive(spacing, (x) => `${x} 0`) ?? "0",
        "align-self": vertical ? "stretch" : undefined,
        width: vertical ? "0" : "100%",
        "box-sizing": "border-box",
      }}
    />
  );
}
