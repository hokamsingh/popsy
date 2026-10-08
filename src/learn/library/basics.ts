import { announcement } from "@/templates/benchmarks";
import { ASSETS, dismiss, n, popup, sec } from "../dsl";
import type { Challenge } from "../types";

export const BASICS: Challenge[] = [
  {
    id: "hello-popup",
    track: "basics",
    level: 1,
    title: "Hello, popup",
    brief: "Build a friendly popup: a big heading, one line of text and a button that closes it.",
    learn: ["Dragging blocks in", "Editing words", "A Close button"],
    hints: [
      "Everything goes inside the Section. Drag a Stack in first; it lines its contents up top to bottom.",
      "Add a Text block for the heading and set its Text style to Heading, then another Text for the sentence.",
      "Add a Button. Under “When clicked”, choose “Close the popup”.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "12px" }, undefined, [
          n("text", { content: "Hello, world!", variant: "heading" }),
          n("text", { content: "This is my first popup." }),
          n("button", { label: "Got it", action: dismiss }),
        ])),
      ]),
  },
  {
    id: "announcement",
    track: "basics",
    level: 1,
    title: "Make an announcement",
    brief: "Recreate the announcement card: a small badge, a heading, a grey sentence and a button, all centred.",
    learn: ["Badge", "Centring a Stack", "Muted text colour"],
    hints: [
      "Put a Stack in the Section and set “Left / right alignment” to Center.",
      "The Badge has an icon picker: choose the bell. The grey text uses the “muted” colour in its Style.",
      "The heading is centred with its own Alignment setting, and the button closes the popup.",
    ],
    build: announcement,
  },
  {
    id: "two-buttons",
    track: "basics",
    level: 1,
    title: "Yes or no",
    brief: "Ask a question with two buttons side by side: a main “Yes” that tells your app, and a quiet “No thanks” that closes the popup.",
    learn: ["Row layout", "Button looks", "Telling your app something"],
    hints: [
      "A Row (side by side) block puts its contents next to each other. Put both buttons inside it.",
      "Set the second button's Look to “Text only”, and its action to “Close the popup”.",
      "The first button uses “Tell your app (custom signal)”. Type the name subscribe.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "16px" }, undefined, [
          n("text", { content: "Join our newsletter?", variant: "heading" }),
          n("text", { content: "One short email a week. Unsubscribe any time." }),
          n("flex", { gap: "12px" }, undefined, [
            n("button", { label: "Yes, sign me up", action: { type: "event", name: "subscribe" } }),
            n("button", { label: "No thanks", variant: "ghost", action: dismiss }),
          ]),
        ])),
      ]),
  },
  {
    id: "rich-text",
    track: "basics",
    level: 1,
    title: "Words with style",
    brief: "Show a list of perks with a bold word and a link, using one Rich Text block.",
    learn: ["Rich Text", "**bold**", "Bullet lists", "[links](…)"],
    hints: [
      "Rich Text understands a tiny bit of markdown: **bold**, - for bullets, and [text](https://…) for links.",
      "Start each bullet line with “- ”. Leave an empty line between the sentence and the list.",
      "The link text is “Read the details” and it points to https://example.com/details.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "12px" }, undefined, [
          n("text", { content: "What's included", variant: "heading" }),
          n("richtext", { content: "**Free** shipping on every order.\n\n- 30-day returns\n- 24/7 support\n- [Read the details](https://example.com/details)" }),
        ])),
      ]),
  },
  {
    id: "space-and-lines",
    track: "basics",
    level: 1,
    title: "Room to breathe",
    brief: "Use a coloured Line and a Space block to give a heading, a sentence and a button some air.",
    learn: ["Line", "Space", "Colour and thickness"],
    hints: [
      "The Line block has Thickness and Color settings; make it thicker and indigo (#4f46e5).",
      "Space blocks are invisible gaps. Put one under the Line, and a small one before the button.",
      "Order top to bottom: small label, Line, Space, heading, text, Space, button.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "0px" }, undefined, [
          n("text", { content: "THIS WEEKEND", variant: "label" }),
          n("divider", { thickness: "3px", color: "#4f46e5" }),
          n("spacer", { height: "24px" }),
          n("text", { content: "Weekend deals", variant: "heading" }),
          n("text", { content: "Hand-picked offers, gone on Monday." }),
          n("spacer", { height: "16px" }),
          n("button", { label: "See the deals", action: dismiss }),
        ])),
      ]),
  },
  {
    id: "rate-us",
    track: "basics",
    level: 1,
    title: "Rate us",
    brief: "Centre an amber star icon above a heading, a sentence and two buttons.",
    learn: ["Icon", "Size and colour", "Two actions"],
    hints: [
      "The Icon block has its own picker: choose “star”, then set Size to 48px and a Color.",
      "The star is amber, #f59e0b. Centre everything with the Stack's “Left / right alignment”.",
      "“Rate now” tells your app rate_app. “Maybe later” is a Text only button that closes the popup.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "8px", align: "center" }, undefined, [
          n("icon", { name: "star", size: "48px", color: "#f59e0b" }),
          n("text", { content: "Enjoying the app?", variant: "heading", align: "center" }),
          n("text", { content: "A quick rating helps us a lot.", align: "center" }),
          n("flex", { gap: "8px" }, undefined, [
            n("button", { label: "Rate now", action: { type: "event", name: "rate_app" } }),
            n("button", { label: "Maybe later", variant: "ghost", action: dismiss }),
          ]),
        ])),
      ]),
  },
  {
    id: "image-banner",
    track: "basics",
    level: 1,
    title: "Banner with a link",
    brief: "Show a wide banner image above a heading, a sentence and a button that opens a web address.",
    learn: ["Image", "Alt text", "Opening a web address"],
    assets: [ASSETS.banner],
    hints: [
      "Add an Image block and paste the banner link. Give it a short description for screen readers.",
      "Set the image's Style width to 100% so it fills the card.",
      "The button's action is “Open a web address”: https://example.com/shop.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "16px" }, undefined, [
          n("image", { src: ASSETS.banner.value, alt: "Summer sale banner" }, { width: "100%", radius: "token:radius.md" }),
          n("text", { content: "Summer sale", variant: "heading" }),
          n("text", { content: "Up to 40% off, this week only." }),
          n("button", { label: "Shop now", action: { type: "external_url", url: "https://example.com/shop", newTab: true } }),
        ])),
      ]),
  },
];
