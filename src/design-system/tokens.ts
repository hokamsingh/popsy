
import { FONTS, fontTokenName } from "./fonts";

export const defaultTokens: Record<string, string> = {
  "color.primary": "#4f46e5",
  "color.primary-contrast": "#ffffff",
  "color.secondary": "#0ea5e9",
  "color.background": "#ffffff",
  "color.surface": "#f8fafc",
  "color.text": "#0f172a",
  "color.muted": "#64748b",
  "color.border": "#e2e8f0",
  "color.success": "#16a34a",
  "color.danger": "#dc2626",
  "spacing.xs": "4px",
  "spacing.sm": "8px",
  "spacing.md": "16px",
  "spacing.lg": "24px",
  "spacing.xl": "32px",
  "radius.sm": "4px",
  "radius.md": "8px",
  "radius.lg": "16px",
  "radius.full": "9999px",
  "shadow.sm": "0 1px 2px rgba(15,23,42,.12)",
  "shadow.md": "0 8px 24px rgba(15,23,42,.16)",
  "shadow.lg": "0 24px 64px rgba(15,23,42,.28)",
  "font.body": "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  "font.heading": "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  ...Object.fromEntries(FONTS.map((font) => [fontTokenName(font.id), font.stack])),
};

const TOKEN_REF = /token:([a-z0-9][a-z0-9.-]*)/g;
const TOKEN_NAME = /^[a-z0-9][a-z0-9.-]*$/;

export const isTokenName = (name: string) => TOKEN_NAME.test(name);

export const tokenVar = (name: string) => `--pp-${name.replace(/\./g, "-")}`;

export function resolveTokens(value: string): string {
  return value.replace(TOKEN_REF, (_, name: string) => `var(${tokenVar(name)})`);
}

const toVars = (tokens: Record<string, string>) =>
  Object.fromEntries(Object.entries(tokens).map(([name, value]) => [tokenVar(name), value]));

const defaultVars = toVars(defaultTokens);

export function tokensToCssVars(custom: Record<string, string> = {}): Record<string, string> {
  return { ...defaultVars, ...toVars(custom) };
}
