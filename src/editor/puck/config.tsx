"use client";
import type { ComponentConfig, Config, Fields } from "@puckeditor/core";
import type { ReactNode } from "react";
import { Badge, Button, Icon, Image, RichText, Text, Video } from "@/components/content";
import { Container, Divider, Flex, Grid, Section, Spacer, Stack } from "@/components/layout";
import { PopupShell } from "@/components/popup/PopupShell";
import { RuntimeContext } from "@/runtime/context";
import {
  ALIGN_VALUES, BADGE_SIZES, BADGE_VARIANTS, BUTTON_SIZES, BUTTON_VARIANTS, COMPONENTS, DECORATIONS,
  FLEX_DIRECTIONS, ICON_POSITIONS, JUSTIFY_VALUES, LINE_STYLES, LOADING_MODES, OBJECT_FITS,
  ORIENTATIONS, TEXT_TAGS, TEXT_VARIANTS, VIDEO_OBJECT_FITS,
} from "@/schema/components";
import { TEXT_ALIGNS, OVERFLOWS, POSITION_MODES } from "@/design-system/styles";
import { ANIMATIONS, POSITIONS, settingsSchema, type PopupSettings } from "@/schema/popup";
import { actionField, boolField, iconField, responsiveField, responsiveToggle, selectField } from "./fields";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

const len = (label: string, placeholder?: string) => responsiveField(label, { placeholder });
const slot = { type: "slot" } as const;

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
      textAlign: responsiveField("Text align", { options: TEXT_ALIGNS }),
      background: len("Background color", "e.g. #fff or token:color.surface"),
      gradient: len("Gradient", "linear-gradient(135deg, #6366f1, #ec4899)"),
      backgroundImage: { type: "text", label: "Background image URL" },
      backgroundSize: len("Background size", "cover"),
      backgroundPosition: len("Background position", "center"),
      border: len("Border", "1px solid #e2e8f0"),
      radius: len("Radius", "e.g. 12px or token:radius.md"),
      shadow: len("Shadow", "token:shadow.md"),
      backdropFilter: len("Backdrop blur (glass)", "blur(12px) saturate(1.4)"),
      opacity: { type: "number", label: "Opacity (0–1)", min: 0, max: 1 },
      overflow: responsiveField("Overflow", { options: OVERFLOWS }),
      position: responsiveField("Position", { options: POSITION_MODES }),
      hidden: responsiveToggle("Hidden"),
    },
  },
};

const alignField = responsiveField("Align", { options: ALIGN_VALUES });
const justifyField = responsiveField("Justify", { options: JUSTIFY_VALUES });

function adapt(Comp: (p: any) => ReactNode): ComponentConfig["render"] {
  const Render = ({ children, ...props }: Props) => <Comp {...props} slot={children} />;
  Render.displayName = `Puck(${Comp.name})`;
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
  Section: component({ children: slot }, adapt(Section), { style: { padding: "32px" } }),
  Container: component({ children: slot }, adapt(Container), { style: { maxWidth: "100%" } }),
  Stack: component(
    { gap: len("Gap", "e.g. 16px"), align: alignField, justify: justifyField, children: slot },
    adapt(Stack),
    { gap: "16px", align: "stretch" },
  ),
  Flex: component(
    {
      direction: responsiveField("Direction", { options: FLEX_DIRECTIONS }),
      wrap: responsiveToggle("Wrap"),
      gap: len("Gap"),
      align: alignField,
      justify: justifyField,
      children: slot,
    },
    adapt(Flex),
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
    adapt(Grid),
    { columns: { desktop: "2", mobile: "1" }, gap: "16px" },
  ),
  Spacer: component({ height: len("Height", "e.g. 24px") }, adapt(Spacer), { height: "24px" }),
  Divider: component(
    {
      orientation: selectField("Orientation", ORIENTATIONS),
      thickness: { type: "text", label: "Thickness" },
      style: selectField("Line style", LINE_STYLES),
      color: { type: "text", label: "Color" },
      spacing: len("Spacing"),
    },
    adapt(Divider),
    { orientation: "horizontal", thickness: "1px", style: "solid", color: "token:color.border" },
  ),
  Text: component(
    {
      content: { type: "textarea", label: "Content" },
      variant: selectField("Variant", TEXT_VARIANTS),
      tag: selectField("HTML tag", TEXT_TAGS, true),
      fontFamily: { type: "text", label: "Font family" },
      fontSize: len("Font size"),
      fontWeight: len("Font weight", "400–900"),
      lineHeight: len("Line height"),
      letterSpacing: len("Letter spacing"),
      align: responsiveField("Alignment", { options: TEXT_ALIGNS }),
      decoration: selectField("Decoration", DECORATIONS, true),
    },
    adapt(Text),
    { content: "Your text here", variant: "body" },
  ),
  RichText: component(
    { content: { type: "textarea", label: "Content (**bold** *italic* __underline__ [link](url), - lists)" } },
    adapt(RichText),
    { content: "Write **rich** text with [links](https://example.com)." },
    "Rich Text",
  ),
  Image: component(
    {
      src: { type: "text", label: "Image URL" },
      alt: { type: "text", label: "Alt text" },
      objectFit: selectField("Object fit", OBJECT_FITS, true),
      objectPosition: { type: "text", label: "Object position" },
      loading: selectField("Loading", LOADING_MODES),
      action: actionField(),
    },
    adapt(Image),
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
      objectFit: selectField("Object fit", VIDEO_OBJECT_FITS, true),
    },
    adapt(Video),
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
    adapt(Icon),
    { name: "star", size: "24px" },
  ),
  Button: component(
    {
      label: { type: "text", label: "Label" },
      variant: selectField("Variant", BUTTON_VARIANTS),
      size: selectField("Size", BUTTON_SIZES),
      icon: iconField(),
      iconPosition: selectField("Icon position", ICON_POSITIONS),
      fullWidth: boolField("Full width"),
      disabled: boolField("Disabled"),
      action: actionField(),
    },
    adapt(Button),
    { label: "Continue", variant: "solid", size: "md", iconPosition: "left", fullWidth: false, disabled: false, action: { type: "dismiss" } },
  ),
  Badge: component(
    {
      text: { type: "text", label: "Text" },
      icon: iconField(),
      variant: selectField("Variant", BADGE_VARIANTS),
      size: selectField("Size", BADGE_SIZES),
    },
    adapt(Badge),
    { text: "New", variant: "soft", size: "md" },
  ),
};

const EDITING = { run: () => {}, editing: true, scope: "" };

const d = settingsSchema.parse({});

const rootFields: Fields = {
  name: { type: "text", label: "Name" },
  title: { type: "text", label: "Accessible title" },
  width: { type: "text", label: "Width" },
  maxWidth: { type: "text", label: "Max width" },
  height: { type: "text", label: "Height" },
  maxHeight: { type: "text", label: "Max height" },
  position: selectField("Position", POSITIONS),
  overlay: boolField("Overlay"),
  overlayColor: { type: "text", label: "Overlay color" },
  overlayBlur: { type: "text", label: "Overlay blur", placeholder: "e.g. blur(6px)" },
  background: { type: "text", label: "Background" },
  radius: { type: "text", label: "Radius" },
  shadow: { type: "text", label: "Shadow" },
  animation: selectField("Animation", ANIMATIONS),
  closeOnEscape: boolField("Close on Escape"),
  closeOnOverlayClick: boolField("Close on overlay click"),
  showCloseButton: boolField("Show close button"),
  lockScroll: boolField("Lock page scroll"),
};

export const puckConfig: Config = {
  categories: {
    layout: { title: "Layout", components: COMPONENTS.filter((c) => c.category === "layout").map((c) => c.editorKey) },
    content: { title: "Content", components: COMPONENTS.filter((c) => c.category === "content").map((c) => c.editorKey) },
  },
  root: {
    fields: rootFields,
    defaultProps: { name: "", ...d },
    render: function PopupRoot({ children, ...props }: Props) {
      return (
        <RuntimeContext.Provider value={EDITING}>
          <PopupShell settings={props as PopupSettings} mode="inline">
            {children}
          </PopupShell>
        </RuntimeContext.Provider>
      );
    },
  },
  components: components as Config["components"],
};
