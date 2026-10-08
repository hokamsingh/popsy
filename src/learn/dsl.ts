import { FONTS } from "@/design-system/fonts";
import { createEmptyPopup, type Popup, type PopupNode, type PopupSettings, type PopupVariable } from "@/schema/popup";
import type { Style } from "@/design-system/styles";

let seq = 0;

/** A block, with a fresh id. */
export const n = (type: string, props: Record<string, unknown> = {}, style?: Style, children?: PopupNode[]): PopupNode => ({
  id: `c${++seq}`,
  type,
  props,
  ...(style ? { style } : {}),
  ...(children ? { children } : {}),
});

/** A challenge's finished popup. */
export function popup(settings: Partial<PopupSettings>, make: () => PopupNode[], variables: PopupVariable[] = []): Popup {
  seq = 0;
  const base = createEmptyPopup("Challenge");
  return { ...base, settings: { ...base.settings, ...settings }, variables, children: make() };
}

/** The padded section every starting popup has, so targets and attempts line up. */
export const sec = (...children: PopupNode[]) => n("section", {}, { padding: "32px" }, children);

export const dismiss = { type: "dismiss" } as const;

export const fontStack = (id: string) => FONTS.find((f) => f.id === id)?.stack ?? "";

export const ASSETS = {
  banner: { label: "Banner image", value: "https://placehold.co/960x400/0f172a/ffffff?text=Summer+sale" },
  hero: { label: "Photo for the background", value: "https://placehold.co/1040x720/1e293b/ffffff?text=Hero" },
  offer: { label: "Offer image", value: "https://placehold.co/380x380/6366f1/ffffff?text=Offer" },
  product: { label: "Product photo", value: "https://placehold.co/328x240/f1f5f9/475569?text=Product" },
  video: { label: "Video", value: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm" },
  tournament: { label: "Banner image", value: "https://placehold.co/960x400/0f172a/ffffff?text=Click+the+banner" },
} as const;
