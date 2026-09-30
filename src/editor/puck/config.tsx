"use client";
import type { ComponentConfig, Config, Fields } from "@puckeditor/core";
import type { ReactNode } from "react";
import { Badge, Button, Icon, Image, RichText, Text, Video } from "@/components/content";
import { Container, Divider, Flex, Grid, Section, Spacer, Stack } from "@/components/layout";
import { PopupShell } from "@/components/popup/PopupShell";
import { RuntimeContext } from "@/runtime/context";
import { ANIMATIONS, POSITIONS, settingsSchema, type PopupSettings } from "@/schema/popup";
import { actionField, boolField, iconField, responsiveField, responsiveToggle, selectField } from "./fields";

/* Puck's generics fight a runtime-driven config; the canonical schema is what guarantees correctness. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

const len = (label: string, placeholder?: string) => responsiveField(label, { placeholder });
const slot = { type: "slot" } as const;

/** The shared Style model, exposed identically on every component. */
const styleFields: Fields = {
  style: {
    type: "object",
    label: "Style",
    objectFields: {
      padding: len("Padding", "e.g. 24px or 8px 16px"),
      margin: len("Margin"),
      width: len("Width", "e.g. 100% or 240px"),
      height: len("Height"),
      minHeight: len("Min height"),
      maxWidth: len("Max width"),
      color: len("Text color", "e.g. #111 or token:color.text"),
      textAlign: responsiveField("Text align", { options: ["left", "center", "right", "justify"] }),
      background: len("Background color", "e.g. #fff or token:color.surface"),
      gradient: len("Gradient", "linear-gradient(135deg, #6366f1, #ec4899)"),
      backgroundImage: { type: "text", label: "Background image URL" },
      backgroundSize: len("Background size", "cover"),
      backgroundPosition: len("Background position", "center"),
      border: len("Border", "1px solid #e2e8f0"),
      radius: len("Radius", "e.g. 12px or token:radius.md"),
      shadow: len("Shadow", "token:shadow.md"),
      opacity: { type: "number", label: "Opacity (0–1)", min: 0, max: 1 },
      overflow: responsiveField("Overflow", { options: ["visible", "hidden", "auto", "scroll"] }),
      position: responsiveField("Position", { options: ["static", "relative", "absolute", "sticky"] }),
      hidden: responsiveToggle("Hidden"),
    },
  },
};

const alignField = responsiveField("Align", { options: ["start", "center", "end", "stretch"] });
const justifyField = responsiveField("Justify", { options: ["start", "center", "end", "between", "around"] });

/** Puck-injected props that primitives must not receive. */
const omitPuck = ({ puck: _p, editMode: _e, ...rest }: Props) => rest; // eslint-disable-line @typescript-eslint/no-unused-vars

/** Wraps a runtime primitive so Puck supplies the container element for slot children. */
function container(Comp: (p: any) => ReactNode): ComponentConfig["render"] {
  const Render = ({ children, ...props }: Props) => <Comp {...omitPuck(props)} slot={children} />;
  Render.displayName = "PuckContainer";
  return Render;
}
function leaf(Comp: (p: any) => ReactNode): ComponentConfig["render"] {
  const Render = (props: Props) => <Comp {...omitPuck(props)} />;
  Render.displayName = "PuckLeaf";
  return Render;
}

const component = (
  fields: Fields,
  render: ComponentConfig["render"],
  defaultProps: Props,
  label?: string,
): ComponentConfig => ({
  label,
  fields: { ...fields, ...styleFields },
  defaultProps: { style: {}, ...defaultProps },
  render,
});

const components: Record<string, ComponentConfig> = {
  Section: component({ children: slot }, container(Section), { style: { padding: "32px" } }),
  Container: component({ children: slot }, container(Container), { style: { maxWidth: "100%" } }),
  Stack: component(
    { gap: len("Gap", "e.g. 16px"), align: alignField, justify: justifyField, children: slot },
    container(Stack),
    { gap: "16px", align: "stretch" },
  ),
  Flex: component(
    {
      direction: responsiveField("Direction", { options: ["row", "column", "row-reverse", "column-reverse"] }),
      wrap: responsiveToggle("Wrap"),
      gap: len("Gap"),
      align: alignField,
      justify: justifyField,
      children: slot,
    },
    container(Flex),
    { direction: "row", gap: "16px", align: "center" },
  ),
  Grid: component(
    {
      columns: len("Columns", "3 or 1fr 2fr"),
      rows: len("Rows"),
      gap: len("Gap"),
      align: alignField,
      justify: justifyField,
      children: slot,
    },
    container(Grid),
    { columns: { desktop: "2", mobile: "1" }, gap: "16px" },
  ),
  Spacer: component({ height: len("Height", "e.g. 24px") }, leaf(Spacer), { height: "24px" }),
  Divider: component(
    {
      orientation: selectField("Orientation", ["horizontal", "vertical"]),
      thickness: { type: "text", label: "Thickness" },
      style: selectField("Line style", ["solid", "dashed", "dotted"]),
      color: { type: "text", label: "Color" },
      spacing: len("Spacing"),
    },
    leaf(Divider),
    { orientation: "horizontal", thickness: "1px", style: "solid", color: "token:color.border" },
  ),
  Text: component(
    {
      content: { type: "textarea", label: "Content" },
      variant: selectField("Variant", ["heading", "subheading", "body", "caption", "label"]),
      tag: selectField("HTML tag", ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div"], true),
      fontFamily: { type: "text", label: "Font family" },
      fontSize: len("Font size"),
      fontWeight: len("Font weight", "400–900"),
      lineHeight: len("Line height"),
      letterSpacing: len("Letter spacing"),
      align: responsiveField("Alignment", { options: ["left", "center", "right", "justify"] }),
      decoration: selectField("Decoration", ["none", "underline", "line-through"], true),
    },
    leaf(Text),
    { content: "Your text here", variant: "body" },
  ),
  RichText: component(
    { content: { type: "textarea", label: "Content (**bold** *italic* __underline__ [link](url), - lists)" } },
    leaf(RichText),
    { content: "Write **rich** text with [links](https://example.com)." },
    "Rich Text",
  ),
  Image: component(
    {
      src: { type: "text", label: "Image URL" },
      alt: { type: "text", label: "Alt text" },
      objectFit: selectField("Object fit", ["cover", "contain", "fill", "none", "scale-down"], true),
      objectPosition: { type: "text", label: "Object position" },
      loading: selectField("Loading", ["lazy", "eager"]),
      action: actionField(),
    },
    leaf(Image),
    {
      src: "https://placehold.co/480x240/e2e8f0/64748b?text=Image",
      alt: "",
      loading: "lazy",
      style: { width: "100%" },
    },
  ),
  Video: component(
    {
      src: { type: "text", label: "Video URL" },
      poster: { type: "text", label: "Poster URL" },
      controls: boolField("Controls"),
      autoplay: boolField("Autoplay (muted only)"),
      muted: boolField("Muted"),
      loop: boolField("Loop"),
      aspectRatio: { type: "text", label: "Aspect ratio (16 / 9)" },
      objectFit: selectField("Object fit", ["cover", "contain", "fill"], true),
    },
    leaf(Video),
    { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm", controls: true, autoplay: false, muted: false, loop: false, aspectRatio: "16 / 9" },
  ),
  Icon: component(
    {
      name: iconField("Icon"),
      size: len("Size", "24px"),
      color: { type: "text", label: "Color" },
      rotation: { type: "number", label: "Rotation (deg)" },
      label: { type: "text", label: "Accessible label" },
    },
    leaf(Icon),
    { name: "star", size: "24px" },
  ),
  Button: component(
    {
      label: { type: "text", label: "Label" },
      variant: selectField("Variant", ["solid", "outline", "ghost", "link"]),
      size: selectField("Size", ["sm", "md", "lg"]),
      icon: iconField(),
      iconPosition: selectField("Icon position", ["left", "right"]),
      fullWidth: boolField("Full width"),
      disabled: boolField("Disabled"),
      action: actionField(),
    },
    leaf(Button),
    { label: "Continue", variant: "solid", size: "md", iconPosition: "left", fullWidth: false, disabled: false, action: { type: "dismiss" } },
  ),
  Badge: component(
    {
      text: { type: "text", label: "Text" },
      icon: iconField(),
      variant: selectField("Variant", ["solid", "soft", "outline"]),
      size: selectField("Size", ["sm", "md"]),
    },
    leaf(Badge),
    { text: "New", variant: "soft", size: "md" },
  ),
};

const d = settingsSchema.parse({});

const rootFields: Fields = {
  name: { type: "text", label: "Name" },
  title: { type: "text", label: "Accessible title" },
  width: { type: "text", label: "Width" },
  maxWidth: { type: "text", label: "Max width" },
  height: { type: "text", label: "Height" },
  maxHeight: { type: "text", label: "Max height" },
  position: selectField("Position", [...POSITIONS]),
  overlay: boolField("Overlay"),
  overlayColor: { type: "text", label: "Overlay color" },
  background: { type: "text", label: "Background" },
  radius: { type: "text", label: "Radius" },
  shadow: { type: "text", label: "Shadow" },
  animation: selectField("Animation", [...ANIMATIONS]),
  closeOnEscape: boolField("Close on Escape"),
  closeOnOverlayClick: boolField("Close on overlay click"),
  showCloseButton: boolField("Show close button"),
  lockScroll: boolField("Lock page scroll"),
};

export const puckConfig: Config = {
  categories: {
    layout: { title: "Layout", components: ["Section", "Container", "Stack", "Flex", "Grid", "Spacer", "Divider"] },
    content: { title: "Content", components: ["Text", "RichText", "Image", "Video", "Icon", "Button", "Badge"] },
  },
  root: {
    fields: rootFields,
    defaultProps: { name: "", ...d },
    // The shell renders inline in the canvas; actions are inert while editing.
    render: function PopupRoot({ children, ...props }: Props) {
      const { name: _name, ...settings } = omitPuck(props); // eslint-disable-line @typescript-eslint/no-unused-vars
      return (
        <RuntimeContext.Provider value={{ run: () => {}, editing: true }}>
          <PopupShell settings={settings as PopupSettings} mode="inline">
            {children}
          </PopupShell>
        </RuntimeContext.Provider>
      );
    },
  },
  components: components as Config["components"],
};
