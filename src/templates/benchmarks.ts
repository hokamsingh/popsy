import { createEmptyPopup, type Popup, type PopupNode } from "@/schema/popup";
import type { Style } from "@/design-system/styles";

let seq = 0;
const node = (
  type: string,
  props: Record<string, unknown> = {},
  style?: Style,
  children?: PopupNode[],
): PopupNode => ({
  id: `n${++seq}`,
  type,
  props,
  ...(style ? { style } : {}),
  ...(children ? { children } : {}),
});

const build = (name: string, settings: Partial<Popup["settings"]>, make: () => PopupNode[]): Popup => {
  seq = 0;
  const base = createEmptyPopup(name);
  return { ...base, settings: { ...base.settings, ...settings }, children: make() };
};

const dismiss = { type: "dismiss" } as const;

export const announcement = () =>
  build("Simple announcement", {}, () => [
    node("section", {}, { padding: "32px" }, [
      node("stack", { gap: "16px", align: "center" }, undefined, [
        node("badge", { text: "Announcement", icon: "bell" }),
        node("text", { content: "We've got news", variant: "heading", align: "center" }),
        node("text", { content: "A short, focused message that explains what changed and why it matters.", align: "center" }, { color: "token:color.muted" }),
        node("button", { label: "Got it", action: dismiss }),
      ]),
    ]),
  ]);

export const fullBleedImage = () =>
  build("Full-bleed image", { width: "520px", showCloseButton: true }, () => [
    node("section", {}, { minHeight: "360px", backgroundImage: "https://placehold.co/1040x720/1e293b/ffffff?text=Hero", backgroundSize: "cover", backgroundPosition: "center", padding: "32px", color: "#ffffff" }, [
      node("stack", { gap: "12px", justify: "end" }, { minHeight: "296px" }, [
        node("text", { content: "Summer collection", variant: "heading" }),
        node("button", { label: "Shop now", variant: "solid", action: { type: "external_url", url: "https://example.com/shop" } }),
      ]),
    ]),
  ]);

export const twoColumnPromotion = () =>
  build("Two-column promotion", { width: "760px" }, () => [
    node("section", {}, { padding: { desktop: "0", mobile: "0" } }, [
      node("grid", { columns: { desktop: "1fr 1fr", mobile: "1" }, gap: "0", align: "stretch" }, undefined, [
        node("image", { src: "https://placehold.co/380x380/6366f1/ffffff?text=Offer", alt: "Offer artwork", objectFit: "cover" }, { width: "100%", height: { desktop: "100%", mobile: "200px" } }),
        node("stack", { gap: "12px", justify: "center" }, { padding: "32px" }, [
          node("badge", { text: "Limited time", variant: "solid", icon: "flame" }),
          node("text", { content: "Get 30% off your first order", variant: "heading" }),
          node("richtext", { content: "Use the code **WELCOME30** at checkout.\n\n- Free shipping\n- 30-day returns" }),
          node("button", { label: "Claim offer", size: "lg", action: { type: "event", name: "claim_offer" } }),
        ]),
      ]),
    ]),
  ]);

export const productCard = () =>
  build("Product card", { width: "360px" }, () => [
    node("container", {}, { padding: "16px" }, [
      node("stack", { gap: "12px" }, undefined, [
        node("image", { src: "https://placehold.co/328x240/f1f5f9/475569?text=Product", alt: "Product photo", objectFit: "cover" }, { width: "100%", radius: "token:radius.md" }),
        node("flex", { justify: "between", align: "center" }, undefined, [
          node("text", { content: "Trail runner", variant: "subheading" }),
          node("text", { content: "$89", variant: "subheading" }, { color: "token:color.primary" }),
        ]),
        node("text", { content: "Lightweight, grippy, and ready for anything.", variant: "caption" }, { color: "token:color.muted" }),
        node("button", { label: "Add to cart", icon: "shopping-cart", fullWidth: true, action: { type: "event", name: "add_to_cart", payload: { sku: "trail-runner" } } }),
      ]),
    ]),
  ]);

export const pricingTable = () =>
  build("Pricing table", { width: "860px" }, () => {
    const tier = (name: string, price: string, features: string[], featured = false) =>
      node("stack", { gap: "12px" }, { padding: "24px", border: featured ? "2px solid token:color.primary" : "1px solid token:color.border", radius: "token:radius.md" }, [
        node("text", { content: name, variant: "label" }),
        node("text", { content: price, variant: "heading" }),
        node("richtext", { content: features.map((f) => `- ${f}`).join("\n") }),
        node("button", { label: "Choose", variant: featured ? "solid" : "outline", fullWidth: true, action: { type: "event", name: "choose_plan", payload: { plan: name } } }),
      ]);
    return [
      node("section", {}, { padding: "32px" }, [
        node("stack", { gap: "24px", align: "center" }, undefined, [
          node("text", { content: "Pick a plan", variant: "heading", align: "center" }),
          node("grid", { columns: { desktop: "3", tablet: "2", mobile: "1" }, gap: "16px" }, { width: "100%" }, [
            tier("Starter", "$0", ["1 project", "Community support"]),
            tier("Pro", "$19", ["Unlimited projects", "Email support", "Analytics"], true),
            tier("Team", "$49", ["Everything in Pro", "Roles & SSO"]),
          ]),
        ]),
      ]),
    ];
  });

export const typographyHeavy = () =>
  build("Typography-heavy", { width: "600px" }, () => [
    node("section", {}, { padding: { desktop: "48px", mobile: "24px" } }, [
      node("stack", { gap: "16px" }, undefined, [
        node("text", { content: "THE LONG READ", variant: "label", letterSpacing: "0.2em" }, { color: "token:color.muted" }),
        node("text", { content: "Why small details matter", variant: "heading", tag: "h1", fontSize: { desktop: "44px", mobile: "30px" }, lineHeight: "1.05", fontWeight: 800 }),
        node("divider", { thickness: "4px", color: "token:color.primary" }, { width: "64px" }),
        node("richtext", { content: "Great interfaces are assembled from *many* small decisions.\n\nRead the [full story](https://example.com/story) or skip it." }),
        node("flex", { gap: "8px" }, undefined, [
          node("button", { label: "Read more", variant: "link", icon: "arrow-right", iconPosition: "right", action: { type: "navigate", to: "/story" } }),
        ]),
      ]),
    ]),
  ]);

export const mobileOnly = () =>
  build("Mobile-only banner", { position: "bottom", width: "100%", radius: "token:radius.lg", overlay: false }, () => [
    node("section", {}, { padding: "16px", hidden: { desktop: true, tablet: true, mobile: false } }, [
      node("flex", { gap: "12px", align: "center", justify: "between" }, undefined, [
        node("text", { content: "Get the app for a better experience", variant: "label" }),
        node("button", { label: "Install", size: "sm", action: { type: "event", name: "install_app" } }),
      ]),
    ]),
  ]);

export const desktopOnly = () =>
  build("Desktop-only panel", { width: "640px" }, () => [
    node("section", {}, { padding: "32px", hidden: { desktop: false, tablet: true, mobile: true } }, [
      node("text", { content: "Best viewed on a larger screen", variant: "heading" }),
    ]),
  ]);

export const videoPopup = () =>
  build("Video popup", { width: "720px" }, () => [
    node("video", { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm", controls: true, aspectRatio: "16 / 9" }),
  ]);

export const glassmorphism = () =>
  build("Glassmorphism", { width: "420px", background: "transparent", shadow: "none", overlayBlur: "blur(6px)", showCloseButton: false }, () => [
    node("section", {}, { padding: "32px", gradient: "linear-gradient(135deg, #6366f1, #ec4899 60%, #f59e0b)", radius: "token:radius.lg" }, [
      node("stack", { gap: "12px", align: "center" }, {
        padding: "28px",
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.35)",
        radius: "token:radius.lg",
        shadow: "0 8px 32px rgba(0,0,0,0.2)",
        color: "#ffffff",
      }, [
        node("badge", { text: "Members only", icon: "sparkles", variant: "outline" }, { color: "#ffffff", border: "1px solid rgba(255,255,255,0.6)" }),
        node("text", { content: "Frosted glass", variant: "heading", align: "center" }),
        node("text", { content: "Translucent surfaces blur whatever sits behind them.", align: "center" }),
        node("button", { label: "Continue", action: dismiss }, {
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.5)",
          color: "#ffffff",
        }),
      ]),
    ]),
  ]);

export const heroDemo = () =>
  build("Home hero demo", { width: "400px", background: "transparent", shadow: "none", showCloseButton: false }, () => [
    node("section", {}, { padding: "8px" }, [
      node("stack", { gap: "14px", align: "start" }, {
        padding: "28px",
        background: "rgba(255,255,255,0.14)",
        backdropFilter: "blur(18px) saturate(1.5)",
        border: "1px solid rgba(255,255,255,0.4)",
        radius: "token:radius.lg",
        shadow: "0 24px 64px rgba(0,0,0,0.35)",
        color: "#ffffff",
      }, [
        node("badge", { text: "Weekend flash sale", icon: "sparkles", variant: "outline" }, { color: "#ffffff", border: "1px solid rgba(255,255,255,0.6)" }),
        node("text", { content: "Take 30% off your first order", variant: "heading", fontSize: "30px", lineHeight: "1.15" }),
        node("text", { content: "Built in the Popsy editor from a handful of generic blocks." }, { color: "rgba(255,255,255,0.85)" }),
        node("flex", { gap: "10px", wrap: true }, undefined, [
          node("button", { label: "Claim offer", icon: "gift", action: { type: "event", name: "claim_offer" } }, { background: "#ffffff", color: "#0f172a" }),
          node("button", { label: "Maybe later", variant: "ghost", action: dismiss }, { color: "#ffffff" }),
        ]),
      ]),
    ]),
  ]);

export const BENCHMARKS: Record<string, () => Popup> = {
  announcement,
  "full-bleed-image": fullBleedImage,
  "two-column-promotion": twoColumnPromotion,
  "product-card": productCard,
  "pricing-table": pricingTable,
  "typography-heavy": typographyHeavy,
  "mobile-only": mobileOnly,
  "desktop-only": desktopOnly,
  "video-popup": videoPopup,
  glassmorphism,
};
