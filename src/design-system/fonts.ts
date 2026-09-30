export const FONT_CATEGORIES = ["Sans serif", "Serif", "Display", "Handwriting", "Monospace"] as const;
export type FontCategory = (typeof FONT_CATEGORIES)[number];

export interface FontOption {
  id: string;
  label: string;
  category: FontCategory;
  stack: string;
}

const SANS_FALLBACK = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const FONTS: FontOption[] = [
  { id: "system", label: "System default", category: "Sans serif", stack: SANS_FALLBACK },
  { id: "inter", label: "Inter", category: "Sans serif", stack: `'Inter Variable', ${SANS_FALLBACK}` },
  { id: "poppins", label: "Poppins", category: "Sans serif", stack: `'Poppins', ${SANS_FALLBACK}` },
  { id: "montserrat", label: "Montserrat", category: "Sans serif", stack: `'Montserrat Variable', ${SANS_FALLBACK}` },
  { id: "nunito", label: "Nunito", category: "Sans serif", stack: `'Nunito Variable', ${SANS_FALLBACK}` },
  { id: "dm-sans", label: "DM Sans", category: "Sans serif", stack: `'DM Sans Variable', ${SANS_FALLBACK}` },
  { id: "georgia", label: "Georgia", category: "Serif", stack: SERIF_FALLBACK },
  { id: "playfair-display", label: "Playfair Display", category: "Serif", stack: `'Playfair Display Variable', ${SERIF_FALLBACK}` },
  { id: "lora", label: "Lora", category: "Serif", stack: `'Lora Variable', ${SERIF_FALLBACK}` },
  { id: "bebas-neue", label: "Bebas Neue", category: "Display", stack: `'Bebas Neue', Impact, ${SANS_FALLBACK}` },
  { id: "oswald", label: "Oswald", category: "Display", stack: `'Oswald Variable', Impact, ${SANS_FALLBACK}` },
  { id: "pacifico", label: "Pacifico", category: "Handwriting", stack: `'Pacifico', cursive` },
  { id: "caveat", label: "Caveat", category: "Handwriting", stack: `'Caveat', cursive` },
  { id: "jetbrains-mono", label: "JetBrains Mono", category: "Monospace", stack: `'JetBrains Mono Variable', ${MONO_FALLBACK}` },
];

export const fontTokenName = (id: string) => `font.${id}`;

export const fontTokenReference = (id: string) => `token:${fontTokenName(id)}`;

export const findFontByReference = (value: string | undefined) =>
  FONTS.find((font) => fontTokenReference(font.id) === value);

export const findFontByStack = (value: string | undefined) => FONTS.find((font) => font.stack === value);
