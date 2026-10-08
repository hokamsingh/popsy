import { cardlessGlass, cornerToast, countdown, glassmorphism, layeredImage, linksAndMedia, mobileOnly, typographyHeavy } from "@/templates/benchmarks";
import { ASSETS, n, popup } from "../dsl";
import type { Challenge } from "../types";

export const POLISH: Challenge[] = [
  {
    id: "corner-toast",
    track: "polish",
    level: 3,
    title: "Corner toast",
    brief: "A small card in the bottom-right corner that slides up, leaves the page usable behind it, and uses its own fonts for the whole popup.",
    learn: ["Popup position", "No dimmed page", "Entrance animation", "Popup-wide fonts"],
    hints: [
      "Page settings: set “Where it appears” to Bottom right and turn off “Dim the page behind”.",
      "Entrance: Slide up. Width 340px. Also turn off “Stop the page scrolling behind it”.",
      "Fonts for the whole popup: headings Playfair Display, body DM Sans. The card has a bell icon and two small buttons.",
    ],
    build: cornerToast,
  },
  {
    id: "top-banner",
    track: "polish",
    level: 3,
    title: "Top banner",
    brief: "A full-width strip across the top of the page with one line of text and a small link button, sliding down from above.",
    learn: ["Full width", "Top position", "Square corners", "Slide animation"],
    hints: [
      "Page settings: Where it appears → Top, Width 100%, and turn off the dimmed page.",
      "Entrance: Slide down. Set Corner roundness to None (0px).",
      "Inside, a Row with space between: a Label text and a small Link button that goes to /shop. Leave room on the right for the × button.",
    ],
    build: () =>
      popup(
        { position: "top", width: "100%", overlay: false, radius: "0px", animation: "slide-down", lockScroll: false },
        () => [
          n("section", {}, { padding: "12px 52px 12px 16px" }, [
            n("flex", { gap: "12px", align: "center", justify: "between" }, undefined, [
              n("text", { content: "Free shipping on orders over $50", variant: "label" }),
              n("button", { label: "Shop now", size: "sm", variant: "link", action: { type: "navigate", to: "/shop" } }),
            ]),
          ]),
        ],
      ),
  },
  {
    id: "frosted-glass",
    track: "polish",
    level: 3,
    title: "Frosted glass",
    brief: "A translucent card with a blurred backdrop sitting on a gradient, with an outlined badge and a glassy button.",
    learn: ["Blur behind", "Transparent colours", "Borders", "Transparent popup background"],
    hints: [
      "Make the popup itself transparent (Background transparent, no shadow) and the outer Section carry the gradient.",
      "The glass is a Stack with a white background at low opacity (rgba(255,255,255,0.18)) and a Blur effect on top.",
      "Add a thin white border, white text, and blur the page behind the popup with “Blur the page behind”.",
    ],
    build: glassmorphism,
  },
  {
    id: "cardless-glass",
    track: "polish",
    level: 3,
    title: "No card at all",
    brief: "Content floating over a dark, blurred page: big uppercase headings (one with a gradient), a gold gift icon and a gradient button.",
    learn: ["Popup without a card", "Gradient text", "Capital letters", "Big icons"],
    hints: [
      "Make the popup background transparent with no shadow, dim the page darker and blur it.",
      "Headings: size 40px, “Capital letters” UPPERCASE. The second heading's text uses a gradient in its Style.",
      "Close button colour white. The icon is a gold (#fbbf24) gift at 120px; the button is large and full width with a gradient.",
    ],
    build: cardlessGlass,
  },
  {
    id: "badge-on-image",
    track: "polish",
    level: 3,
    title: "Badge on an image",
    brief: "Stack things on top of each other: a gradient fills the box, a “New” badge sits top-left and a heading bottom-left.",
    learn: ["Layers", "Anchors", "Offsets"],
    hints: [
      "A Layers block stacks its children. Set its height to 280px and drop blocks into it.",
      "Each block has a position pad in its Style: choose Top left, Bottom left, or Fill.",
      "The background is a Space block set to Fill with a gradient. Offsets of 16px and 20px keep the others off the edge.",
    ],
    build: layeredImage,
  },
  {
    id: "countdown-offer",
    track: "polish",
    level: 3,
    title: "Countdown offer",
    brief: "A sale popup with a 90-minute timer that starts when it opens, a message when it ends and a big button.",
    learn: ["Countdown", "Timer that starts on open", "End message", "Telling your app"],
    hints: [
      "Add a Countdown and switch it to “Starts when the popup opens”, 90 minutes. Hide the days.",
      "Fill in “Message when it ends”, and set “When it reaches zero” to tell your app offer_ended.",
      "Around it: a solid badge with a clock icon, a centred heading, and a large button that tells your app shop_sale.",
    ],
    build: countdown,
  },
  {
    id: "phones-only",
    track: "polish",
    level: 3,
    title: "Phones only",
    brief: "An app-install strip that only appears on phones, stuck to the bottom of the screen.",
    learn: ["Hiding per device", "Bottom position"],
    hints: [
      "Page settings: Where it appears → Bottom, Width 100%, no dimmed page.",
      "Select the Section and use its Style → Hidden. Hide it on Desktop and Tablet, but not Mobile.",
      "Inside: a Row with a Label text and a small button that tells your app install_app. Leave room on the right for the ×.",
    ],
    build: mobileOnly,
  },
  {
    id: "responsive-type",
    track: "polish",
    level: 3,
    title: "Type that adapts",
    brief: "An editorial layout where the heading is 44px on desktop but 30px on phones, with tighter padding on small screens.",
    learn: ["Per-device sizes", "Letter spacing", "Short coloured Line", "Link button"],
    hints: [
      "Set a value on the Desktop tab, then switch to Mobile and set a smaller one.",
      "Heading: 44px desktop, 30px mobile, extra bold. The Section's padding is 48px on desktop, 24px on mobile.",
      "A short, thick Line (width 64px, thickness 4px) sits under the heading, followed by rich text with a link and a link-style button.",
    ],
    build: typographyHeavy,
  },
  {
    id: "links-and-timer",
    track: "polish",
    level: 3,
    title: "Clickable banner",
    brief: "A banner image that opens a web address, rich text with links, a 10-minute timer and a button that shows “Bonus added!” when your app says it worked.",
    learn: ["Clickable images", "Links in rich text", "Success message"],
    assets: [ASSETS.tournament],
    hints: [
      "The Image block has its own “When clicked” setting: open https://example.com/tournament.",
      "Rich Text links use [text](address). Add a 10-minute Countdown that tells your app reservation_expired when it ends.",
      "The button tells your app claim_bonus, sends source = links-and-media, and shows a success message on the button.",
    ],
    build: linksAndMedia,
  },
];
