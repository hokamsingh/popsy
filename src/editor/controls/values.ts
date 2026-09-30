import { defaultTokens } from "@/design-system/tokens";

export const LENGTH_UNITS = ["px", "%", "rem", "em"] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

export interface Length {
  amount: number;
  unit: LengthUnit;
}

const LENGTH_PATTERN = /^(-?\d*\.?\d+)(px|%|rem|em)$/;

export function parseLength(value: string | undefined): Length | null {
  const match = value ? LENGTH_PATTERN.exec(value.trim()) : null;
  return match ? { amount: Number(match[1]), unit: match[2] as LengthUnit } : null;
}

export const formatLength = ({ amount, unit }: Length) => `${amount}${unit}`;

export type Sides = [top: number, right: number, bottom: number, left: number];

export function parseSides(value: string | undefined): Sides | null {
  if (!value) return [0, 0, 0, 0];
  const parts = value.trim().split(/\s+/).map(parseLength);
  if (parts.length > 4 || parts.some((part) => part === null || part.unit !== "px")) return null;
  const [top, right = top, bottom = top, left = right] = parts.map((part) => part!.amount);
  return [top, right, bottom, left];
}

export function formatSides([top, right, bottom, left]: Sides): string {
  if (top === right && right === bottom && bottom === left) return `${top}px`;
  if (top === bottom && right === left) return `${top}px ${right}px`;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

export interface Color {
  hex: string;
  alpha: number;
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_PATTERN = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;
const TOKEN_PATTERN = /^token:(color\.[a-z0-9.-]+)$/;

const toHexPair = (channel: number) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0");

function expandShortHex(hex: string) {
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

export function parseColor(value: string | undefined): Color | null {
  if (!value) return null;
  const text = value.trim();
  if (HEX_PATTERN.test(text)) return { hex: expandShortHex(text).toLowerCase(), alpha: 1 };
  const rgb = RGB_PATTERN.exec(text);
  if (rgb) {
    const hex = `#${toHexPair(Number(rgb[1]))}${toHexPair(Number(rgb[2]))}${toHexPair(Number(rgb[3]))}`;
    return { hex, alpha: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  }
  const token = TOKEN_PATTERN.exec(text);
  if (token && defaultTokens[token[1]]) return parseColor(defaultTokens[token[1]]);
  return null;
}

export function formatColor({ hex, alpha }: Color): string {
  if (alpha >= 1) return hex;
  const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16);
  return `rgba(${channel(1)}, ${channel(3)}, ${channel(5)}, ${Number(alpha.toFixed(2))})`;
}

export const isTokenColor = (value: string | undefined) => !!value && TOKEN_PATTERN.test(value.trim());

export const BORDER_STYLES = ["solid", "dashed", "dotted"] as const;
export type BorderStyle = (typeof BORDER_STYLES)[number];

export interface Border {
  width: number;
  style: BorderStyle;
  color: string;
}

const BORDER_PATTERN = /^(\d*\.?\d+)px\s+(solid|dashed|dotted)\s+(.+)$/;

export function parseBorder(value: string | undefined): Border | null {
  const match = value ? BORDER_PATTERN.exec(value.trim()) : null;
  return match ? { width: Number(match[1]), style: match[2] as BorderStyle, color: match[3] } : null;
}

export const formatBorder = ({ width, style, color }: Border) => `${width}px ${style} ${color}`;

const BLUR_PATTERN = /blur\((\d*\.?\d+)px\)/;

export const parseBlur = (value: string | undefined): number =>
  Number(BLUR_PATTERN.exec(value ?? "")?.[1] ?? 0);

export function formatBlur(amount: number, previous: string | undefined): string | undefined {
  if (amount <= 0) return undefined;
  const blur = `blur(${amount}px)`;
  if (previous && BLUR_PATTERN.test(previous)) return previous.replace(BLUR_PATTERN, blur);
  return blur;
}

const twoDigits = (n: number) => String(n).padStart(2, "0");

export function isoToLocalInput(iso: string | undefined): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
  return `${day}T${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

export function localInputToIso(local: string): string | undefined {
  const date = new Date(local);
  return local && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

