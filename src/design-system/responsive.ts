export const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

export const BREAKPOINT_WIDTHS = { tablet: 1024, mobile: 640 } as const;

export type ResponsiveObject<T> = Partial<Record<Breakpoint, T>>;
export type Responsive<T> = T | ResponsiveObject<T>;

export function isResponsiveObject<T>(v: Responsive<T>): v is ResponsiveObject<T> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mapResponsive<T, U>(v: Responsive<T> | undefined, fn: (x: T) => U): Responsive<U> | undefined {
  if (v === undefined) return undefined;
  if (!isResponsiveObject(v)) return fn(v);
  return Object.fromEntries(Object.entries(v).map(([bp, x]) => [bp, fn(x as T)])) as ResponsiveObject<U>;
}

export function expandResponsive<T>(v: Responsive<T> | undefined): ResponsiveObject<T> {
  if (v === undefined) return {};
  return isResponsiveObject(v) ? v : { desktop: v as T };
}

export function resolveResponsive<T>(v: Responsive<T> | undefined): ResponsiveObject<T> {
  const { desktop, tablet, mobile } = expandResponsive(v);
  const t = tablet ?? desktop;
  const m = mobile ?? t;
  const out: ResponsiveObject<T> = {};
  if (desktop !== undefined) out.desktop = desktop;
  if (t !== undefined) out.tablet = t;
  if (m !== undefined) out.mobile = m;
  return out;
}

export const MEDIA = {
  tablet: `(max-width: ${BREAKPOINT_WIDTHS.tablet}px)`,
  mobile: `(max-width: ${BREAKPOINT_WIDTHS.mobile}px)`,
  desktopOnly: `(min-width: ${BREAKPOINT_WIDTHS.tablet + 1}px)`,
  tabletOnly: `(min-width: ${BREAKPOINT_WIDTHS.mobile + 1}px) and (max-width: ${BREAKPOINT_WIDTHS.tablet}px)`,
} as const;
