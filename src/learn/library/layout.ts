import { pricingTable, productCard, twoColumnPromotion, videoPopup } from "@/templates/benchmarks";
import { ASSETS, dismiss, fontStack, n, popup, sec } from "../dsl";
import { allNodes } from "../objectives";
import type { Challenge } from "../types";

export const LAYOUT: Challenge[] = [
  {
    id: "two-columns",
    track: "layout",
    level: 2,
    title: "Two columns",
    brief: "Recreate the promotion: an image beside the offer on desktop that stacks on phones, with a badge, heading, rich text and a button.",
    learn: ["Grid", "Per-device values", "Rich text"],
    assets: [ASSETS.offer],
    hints: [
      "A Grid block makes columns. Try “Number of columns” 2 on desktop, then add a value for Mobile.",
      "Click the small device tabs above a setting to give mobile its own value: 1 column.",
      "The image fills its half with “Fill the space”; the text side is a Stack with generous padding.",
    ],
    build: twoColumnPromotion,
  },
  {
    id: "button-row",
    track: "layout",
    level: 2,
    title: "Buttons that wrap",
    brief: "Centre a heading above three buttons of different sizes and looks that wrap onto a new line when there isn't room.",
    learn: ["Row wrapping", "Button size and look", "Spreading items"],
    hints: [
      "Put the buttons in a Row and turn on “Wrap onto new lines”. Spread them to the Center.",
      "Sizes: Small, Medium, Large. Looks: Outline, Filled, Text only.",
      "Heading “Pick a size”, then Small + Outline, Medium + Filled, Large + Text only.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "16px", align: "center" }, undefined, [
          n("text", { content: "Pick a size", variant: "heading", align: "center" }),
          n("flex", { gap: "12px", wrap: true, justify: "center" }, undefined, [
            n("button", { label: "Small", size: "sm", variant: "outline", action: dismiss }),
            n("button", { label: "Medium", size: "md", action: dismiss }),
            n("button", { label: "Large", size: "lg", variant: "ghost", action: dismiss }),
          ]),
        ])),
      ]),
  },
  {
    id: "pricing-table",
    track: "layout",
    level: 2,
    title: "Pricing table",
    brief: "Three plan cards in a grid that shows 3 across on desktop, 2 on tablet and 1 on phones. The middle plan has a coloured outline.",
    learn: ["Grid per device", "Bordered cards", "Repeating a pattern"],
    hints: [
      "Build one plan card (a Stack with a border and padding), then duplicate it with the copy button.",
      "Grid columns can differ on every device: 3, 2 and 1.",
      "The featured plan's border is 2px solid in the primary colour, and its button is Filled instead of Outline.",
    ],
    build: pricingTable,
  },
  {
    id: "product-card",
    track: "layout",
    level: 2,
    title: "Product card",
    brief: "A product photo, a row with the name on the left and price on the right, a grey caption and a full-width Add to cart button.",
    learn: ["Spreading a row", "Full-width button", "Sending data to your app"],
    assets: [ASSETS.product],
    hints: [
      "In a Row, set “Spread items” to “Space between” to push name and price apart.",
      "The price uses the primary colour. The button has a cart icon and is stretched to full width.",
      "Add to cart tells your app add_to_cart and sends the data sku = trail-runner.",
    ],
    build: productCard,
  },
  {
    id: "night-mode",
    track: "layout",
    level: 2,
    title: "Night mode",
    brief: "Make the whole popup dark with big rounded corners and a soft glow, with an amber button.",
    learn: ["Popup background", "Corner roundness", "Shadow", "Block colours"],
    hints: [
      "Click the popup itself (the Page settings) to change its Background, Corner roundness and Shadow.",
      "Background #0f172a, corners 24px, width 400px. The glow is a shadow like 0 20px 60px rgba(15,23,42,0.45).",
      "Make text white in the Stack's Style, and the button amber (#f59e0b) with dark text. Close button colour: white.",
    ],
    build: () =>
      popup(
        { width: "400px", background: "#0f172a", radius: "24px", shadow: "0 20px 60px rgba(15,23,42,0.45)", closeButtonColor: "#ffffff" },
        () => [
          sec(n("stack", { gap: "12px" }, { color: "#ffffff" }, [
            n("text", { content: "Night mode", variant: "heading" }),
            n("text", { content: "Dark background, big corners and a soft glow." }),
            n("button", { label: "Switch on", action: dismiss }, { background: "#f59e0b", color: "#0f172a" }),
          ])),
        ],
      ),
  },
  {
    id: "popup-fonts",
    track: "layout",
    level: 2,
    title: "Two fonts",
    brief: "Pick one font for headings and another for everything else, for the whole popup at once.",
    learn: ["Popup-wide fonts", "Heading vs body font"],
    hints: [
      "Click the popup (Page settings) and find “Fonts for the whole popup”.",
      "Headings use Playfair Display; body text uses DM Sans.",
      "Then add a heading, a sentence and a button; they pick the fonts up automatically.",
    ],
    build: () =>
      popup({ width: "480px", tokens: { "font.heading": fontStack("playfair-display"), "font.body": fontStack("dm-sans") } }, () => [
        sec(n("stack", { gap: "12px" }, undefined, [
          n("text", { content: "The Weekly Edit", variant: "heading" }),
          n("text", { content: "Hand-picked stories, delivered every Friday morning." }),
          n("button", { label: "Read now", action: dismiss }),
        ])),
      ]),
  },
  {
    id: "video",
    track: "layout",
    level: 2,
    title: "Video popup",
    brief: "A wide video player with controls and a 16:9 shape.",
    learn: ["Video block", "Aspect ratio", "Popup width"],
    assets: [ASSETS.video],
    extraObjectives: [
      {
        id: "video:shape",
        label: "Give the video a 16 / 9 shape",
        passed: (a) => allNodes(a.children).some((x) => x.type === "video" && String(x.props.aspectRatio ?? "").replace(/\s/g, "") === "16/9"),
      },
    ],
    hints: [
      "Add a Video block straight into the Section and paste the video link.",
      "Set its “Shape” to 16 / 9 so it keeps a cinema ratio.",
      "Make the popup wider: Page settings → Width 720px.",
    ],
    build: videoPopup,
  },
  {
    id: "gradient-card",
    track: "layout",
    level: 2,
    title: "Gradient card",
    brief: "A centred card with a diagonal indigo-to-pink gradient, white text, rounded corners and a badge.",
    learn: ["Gradients", "Text colour", "Corner roundness"],
    hints: [
      "Select the Section: its Style has a Gradient field. Try a linear gradient at 135 degrees.",
      "Gradient: linear-gradient(135deg, #6366f1, #ec4899). Set the section's text colour to white.",
      "Round the Section's corners with the “large” size, and centre the Stack.",
    ],
    build: () =>
      popup({}, () => [
        n("section", {}, { padding: "32px", gradient: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#ffffff", radius: "token:radius.lg" }, [
          n("stack", { gap: "12px", align: "center" }, undefined, [
            n("badge", { text: "Launch week", icon: "sparkles", variant: "outline" }, { color: "#ffffff", border: "1px solid rgba(255,255,255,0.6)" }),
            n("text", { content: "Big news", variant: "heading", align: "center" }),
            n("text", { content: "Something you've been waiting for just arrived.", align: "center" }),
            n("button", { label: "Take a look", action: dismiss }, { background: "#ffffff", color: "#0f172a" }),
          ]),
        ]),
      ]),
  },
];
