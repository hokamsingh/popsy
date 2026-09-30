export interface ExampleInfo {
  id: string;
  title: string;
  blurb: string;
}

export const EXAMPLES: ExampleInfo[] = [
  { id: "announcement", title: "Announcement", blurb: "A short message with one clear action." },
  { id: "two-column-promotion", title: "Two-column promotion", blurb: "Image and offer side by side, stacked on mobile." },
  { id: "pricing-table", title: "Pricing table", blurb: "Three plans in a grid that reflows by device." },
  { id: "glassmorphism", title: "Frosted glass", blurb: "Translucent surfaces with a blurred backdrop." },
  { id: "layered-image", title: "Badge on an image", blurb: "Text and badges layered on top of a picture." },
  { id: "product-card", title: "Product card", blurb: "Photo, price and an add-to-cart event." },
  { id: "typography-heavy", title: "Editorial", blurb: "Type-led layout with responsive font sizes." },
  { id: "full-bleed-image", title: "Full-bleed image", blurb: "A background photo with text on top." },
  { id: "video-popup", title: "Video", blurb: "A video player in a dialog." },
];
