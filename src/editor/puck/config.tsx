"use client";
import type { ComponentConfig, Config, Fields } from "@puckeditor/core";
import type { ReactNode } from "react";
import { Badge, Button, Icon, Image, RichText, Text, Video } from "@/components/content";
import { Container, Divider, Flex, Grid, Section, Spacer, Stack } from "@/components/layout";
import { PopupShell } from "@/components/popup/PopupShell";
import { RuntimeContext } from "@/runtime/context";
import { COMPONENTS } from "@/schema/components";
import { settingsSchema, type PopupSettings } from "@/schema/popup";
import type { Choice } from "../controls/ChoiceControl";
import {
  actionField, blurField, choiceField, colorField, iconField, lengthField, numberField, styleField, textField, toggleField,
} from "./fields";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

const ALIGN_CHOICES: Choice<string>[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
];

const SPREAD_CHOICES: Choice<string>[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "between", label: "Space between" },
  { value: "around", label: "Space around" },
];

const DIRECTION_CHOICES: Choice<string>[] = [
  { value: "row", label: "Side by side" },
  { value: "column", label: "Stacked" },
  { value: "row-reverse", label: "Side by side, reversed" },
  { value: "column-reverse", label: "Stacked, reversed" },
];

const TEXT_STYLE_CHOICES: Choice<string>[] = [
  { value: "heading", label: "Heading" },
  { value: "subheading", label: "Subheading" },
  { value: "body", label: "Body text" },
  { value: "caption", label: "Small caption" },
  { value: "label", label: "Label" },
];

const TEXT_TAG_CHOICES: Choice<string>[] = [
  { value: "h1", label: "Main heading (H1)" },
  { value: "h2", label: "Heading (H2)" },
  { value: "h3", label: "Subheading (H3)" },
  { value: "h4", label: "Small heading (H4)" },
  { value: "p", label: "Paragraph" },
  { value: "span", label: "Inline text" },
];

const FONT_WEIGHT_CHOICES: Choice<string>[] = [
  { value: "400", label: "Normal" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

const TEXT_ALIGN_CHOICES: Choice<string>[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

const DECORATION_CHOICES: Choice<string>[] = [
  { value: "underline", label: "Underline" },
  { value: "line-through", label: "Strikethrough" },
];

const IMAGE_FIT_CHOICES: Choice<string>[] = [
  { value: "cover", label: "Fill the space" },
  { value: "contain", label: "Fit inside" },
  { value: "fill", label: "Stretch" },
  { value: "none", label: "Original size" },
  { value: "scale-down", label: "Shrink only" },
];

const VIDEO_FIT_CHOICES: Choice<string>[] = IMAGE_FIT_CHOICES.slice(0, 3);

const LOADING_CHOICES: Choice<string>[] = [
  { value: "lazy", label: "When scrolled into view" },
  { value: "eager", label: "Immediately" },
];

const BUTTON_LOOK_CHOICES: Choice<string>[] = [
  { value: "solid", label: "Filled" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Text only" },
  { value: "link", label: "Link" },
];

const BUTTON_SIZE_CHOICES: Choice<string>[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const BADGE_LOOK_CHOICES: Choice<string>[] = [
  { value: "soft", label: "Soft" },
  { value: "solid", label: "Filled" },
  { value: "outline", label: "Outline" },
];

const SIDE_CHOICES: Choice<string>[] = [
  { value: "left", label: "Before the text" },
  { value: "right", label: "After the text" },
];

const DIVIDER_STYLE_CHOICES: Choice<string>[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

const ORIENTATION_CHOICES: Choice<string>[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
];

const POSITION_CHOICES: Choice<string>[] = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

const ANIMATION_CHOICES: Choice<string>[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade in" },
  { value: "scale", label: "Pop in" },
  { value: "slide-up", label: "Slide up" },
  { value: "slide-down", label: "Slide down" },
];

const SHADOW_CHOICES: Choice<string>[] = [
  { value: "none", label: "None" },
  { value: "token:shadow.sm", label: "Soft" },
  { value: "token:shadow.md", label: "Medium" },
  { value: "token:shadow.lg", label: "Strong" },
];

const gap = lengthField("Space between items", { perDevice: true, slider: { min: 0, max: 64 }, hint: "The gap between each item." });

const slot = { type: "slot" } as const;

function adapt(Comp: (p: any) => ReactNode): ComponentConfig["render"] {
  const Render = ({ children, ...props }: Props) => <Comp {...props} slot={children} />;
  Render.displayName = `Puck(${Comp.name})`;
  return Render;
}

const component = (label: string, fields: Fields, render: ComponentConfig["render"], defaultProps: Props): ComponentConfig => ({
  label,
  fields: { ...fields, style: styleField() },
  defaultProps: { style: {}, ...defaultProps },
  render,
});

const components: Record<string, ComponentConfig> = {
  Section: component("Section", { children: slot }, adapt(Section), { style: { padding: "32px" } }),
  Container: component("Container", { children: slot }, adapt(Container), { style: { maxWidth: "100%" } }),
  Stack: component(
    "Stack (top to bottom)",
    {
      gap,
      align: choiceField("Left / right alignment", ALIGN_CHOICES, { perDevice: true, hint: "Where items sit across the width." }),
      justify: choiceField("Up / down alignment", SPREAD_CHOICES, { perDevice: true, hint: "Only matters when the stack is taller than its items." }),
      children: slot,
    },
    adapt(Stack),
    { gap: "16px", align: "stretch" },
  ),
  Flex: component(
    "Row (side by side)",
    {
      direction: choiceField("Direction", DIRECTION_CHOICES, { perDevice: true, hint: "Switch to Stacked on mobile to stop items getting squeezed." }),
      wrap: toggleField("Wrap onto new lines", "Items move to the next line when there isn't room."),
      gap,
      align: choiceField("Line up items", ALIGN_CHOICES, { perDevice: true, hint: "Across the direction of travel, e.g. top or bottom in a row." }),
      justify: choiceField("Spread items", SPREAD_CHOICES, { perDevice: true, hint: "Along the direction of travel, e.g. left or right in a row." }),
      children: slot,
    },
    adapt(Flex),
    { direction: "row", gap: "16px", align: "center" },
  ),
  Grid: component(
    "Grid (columns)",
    {
      columns: numberField("Number of columns", { perDevice: true, min: 1, max: 6, hint: "Try 2 on desktop and 1 on mobile." }),
      gap,
      align: choiceField("Line up items", ALIGN_CHOICES, { perDevice: true }),
      justify: choiceField("Spread items", ALIGN_CHOICES, { perDevice: true }),
      children: slot,
    },
    adapt(Grid),
    { columns: { desktop: "2", mobile: "1" }, gap: "16px" },
  ),
  Spacer: component(
    "Space",
    { height: lengthField("Height", { perDevice: true, slider: { min: 4, max: 200 } }) },
    adapt(Spacer),
    { height: "24px" },
  ),
  Divider: component(
    "Line",
    {
      orientation: choiceField("Direction", ORIENTATION_CHOICES),
      thickness: lengthField("Thickness", { slider: { min: 1, max: 12 }, units: ["px"] }),
      style: choiceField("Line style", DIVIDER_STYLE_CHOICES),
      color: colorField("Color"),
      spacing: lengthField("Space above and below", { perDevice: true, slider: { min: 0, max: 64 } }),
    },
    adapt(Divider),
    { orientation: "horizontal", thickness: "1px", style: "solid", color: "token:color.border" },
  ),
  Text: component(
    "Text",
    {
      content: textField("Words", { multiline: true }),
      variant: choiceField("Text style", TEXT_STYLE_CHOICES, { hint: "Sets a sensible size and weight. Fine-tune below." }),
      fontSize: lengthField("Text size", { perDevice: true, slider: { min: 10, max: 96 }, units: ["px", "rem"], hint: "Leave empty to use the text style's size." }),
      fontWeight: choiceField("Weight", FONT_WEIGHT_CHOICES, { unsetLabel: "Default", perDevice: true }),
      align: choiceField("Alignment", TEXT_ALIGN_CHOICES, { perDevice: true, unsetLabel: "Default" }),
      lineHeight: numberField("Line spacing", { step: 0.1, min: 0.8, max: 3, hint: "1.5 is comfortable for paragraphs." }),
      letterSpacing: lengthField("Letter spacing", { slider: { min: -2, max: 12 }, units: ["px", "em"] }),
      decoration: choiceField("Decoration", DECORATION_CHOICES, { unsetLabel: "None" }),
      tag: choiceField("Meaning for search engines and screen readers", TEXT_TAG_CHOICES, { unsetLabel: "Automatic" }),
      fontFamily: textField("Font (advanced)", { hint: "A font name installed on the page, e.g. Georgia." }),
    },
    adapt(Text),
    { content: "Your text here", variant: "body" },
  ),
  RichText: component(
    "Rich Text",
    {
      content: textField("Words", {
        multiline: true,
        hint: "**bold**, *italic*, __underline__, [link text](https://…). Start a line with - for a bullet list.",
      }),
    },
    adapt(RichText),
    { content: "Write **rich** text with [links](https://example.com)." },
  ),
  Image: component(
    "Image",
    {
      src: textField("Image link", { placeholder: "https://example.com/photo.jpg", hint: "Paste the web address of a picture." }),
      alt: textField("Description", { hint: "Describe the image for people who can't see it. Leave empty if it's only decoration." }),
      objectFit: choiceField("How it fills the space", IMAGE_FIT_CHOICES, { unsetLabel: "Default" }),
      loading: choiceField("Load", LOADING_CHOICES),
      action: actionField(),
    },
    adapt(Image),
    { src: "https://placehold.co/480x240/e2e8f0/64748b?text=Image", alt: "", loading: "lazy", style: { width: "100%" } },
  ),
  Video: component(
    "Video",
    {
      src: textField("Video link", { placeholder: "https://example.com/video.mp4" }),
      poster: textField("Cover image link", { hint: "Shown before the video plays." }),
      controls: toggleField("Show play controls"),
      autoplay: toggleField("Start automatically", "Browsers only allow this when the video is muted."),
      muted: toggleField("Muted"),
      loop: toggleField("Repeat"),
      aspectRatio: textField("Shape", { placeholder: "16 / 9", hint: "Width / height, e.g. 16 / 9 or 1 / 1." }),
      objectFit: choiceField("How it fills the space", VIDEO_FIT_CHOICES, { unsetLabel: "Default" }),
    },
    adapt(Video),
    {
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
      aspectRatio: "16 / 9",
    },
  ),
  Icon: component(
    "Icon",
    {
      name: iconField("Icon", { required: true }),
      size: lengthField("Size", { perDevice: true, slider: { min: 12, max: 96 } }),
      color: colorField("Color"),
      rotation: numberField("Rotate (degrees)", { min: -360, max: 360, step: 15 }),
      label: textField("Description", { hint: "Only needed if the icon carries meaning on its own." }),
    },
    adapt(Icon),
    { name: "star", size: "24px" },
  ),
  Button: component(
    "Button",
    {
      label: textField("Button text"),
      action: actionField("When clicked"),
      variant: choiceField("Look", BUTTON_LOOK_CHOICES),
      size: choiceField("Size", BUTTON_SIZE_CHOICES),
      icon: iconField("Icon"),
      iconPosition: choiceField("Icon position", SIDE_CHOICES),
      fullWidth: toggleField("Stretch to full width"),
      disabled: toggleField("Disabled", "Greyed out and not clickable."),
    },
    adapt(Button),
    { label: "Continue", variant: "solid", size: "md", iconPosition: "left", fullWidth: false, disabled: false, action: { type: "dismiss" } },
  ),
  Badge: component(
    "Badge",
    {
      text: textField("Text"),
      icon: iconField("Icon"),
      variant: choiceField("Look", BADGE_LOOK_CHOICES),
      size: choiceField("Size", [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
      ]),
    },
    adapt(Badge),
    { text: "New", variant: "soft", size: "md" },
  ),
};

const EDITING = { run: () => {}, editing: true, scope: "" };

const defaultSettings = settingsSchema.parse({});

const rootFields: Fields = {
  name: textField("Popup name", { hint: "Only you see this." }),
  title: textField("Title for screen readers", { hint: "Announced when the popup opens. Not shown on screen." }),
  width: lengthField("Width", { slider: { min: 240, max: 1000, step: 10 }, units: ["px", "%"] }),
  height: lengthField("Height", { slider: { min: 120, max: 900, step: 10 }, hint: "Leave empty to fit the content." }),
  position: choiceField("Where it appears", POSITION_CHOICES),
  background: colorField("Background color"),
  radius: lengthField("Corner roundness", { slider: { min: 0, max: 48 }, units: ["px"] }),
  shadow: choiceField("Shadow", SHADOW_CHOICES),
  animation: choiceField("Entrance", ANIMATION_CHOICES),
  overlay: toggleField("Dim the page behind", "Turn off to keep the page usable while the popup shows."),
  overlayColor: colorField("Dim color"),
  overlayBlur: blurField("Blur the page behind", "A soft-focus effect behind the popup."),
  closeOnEscape: toggleField("Close with the Escape key"),
  closeOnOverlayClick: toggleField("Close when the dimmed area is clicked"),
  showCloseButton: toggleField("Show a close (×) button"),
  lockScroll: toggleField("Stop the page scrolling behind it"),
};

export const puckConfig: Config = {
  categories: {
    layout: { title: "Layout", components: COMPONENTS.filter((c) => c.category === "layout").map((c) => c.editorKey) },
    content: { title: "Content", components: COMPONENTS.filter((c) => c.category === "content").map((c) => c.editorKey) },
  },
  root: {
    fields: rootFields,
    defaultProps: { name: "", ...defaultSettings },
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
