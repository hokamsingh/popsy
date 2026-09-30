import { describe, expect, it } from "vitest";
import { buildCss } from "./styles";
import { resolveResponsive } from "./responsive";
import { resolveTokens, tokensToCssVars } from "./tokens";

describe("buildCss", () => {
  it("emits base, then tablet, then mobile overrides", () => {
    const css = buildCss(".x", {}, { padding: { desktop: "32px", tablet: "24px", mobile: "16px" } });
    expect(css).toBe(
      ".x{padding:32px}@media (max-width: 1024px){.x{padding:24px}}@media (max-width: 640px){.x{padding:16px}}",
    );
  });

  it("resolves tokens inside values", () => {
    expect(buildCss(".x", {}, { color: "token:color.primary", border: "1px solid token:color.border" })).toContain(
      "color:var(--pp-color-primary)",
    );
    expect(resolveTokens("token:spacing.sm token:spacing.lg")).toBe("var(--pp-spacing-sm) var(--pp-spacing-lg)");
  });

  it("drops unsafe values instead of emitting them", () => {
    expect(buildCss(".x", { color: "red;background:url(x)" })).toBe("");
  });

  it("hides per breakpoint range, not by cascade", () => {
    const css = buildCss(".x", {}, { hidden: { desktop: true, tablet: false } });
    expect(css).toContain("(min-width: 1025px){.x{display:none!important}}");
    expect(css).not.toContain("max-width: 640px){.x{display:none");
  });

  it("hidden on mobile only", () => {
    const css = buildCss(".x", {}, { hidden: { mobile: true } });
    expect(css).toBe("@media (max-width: 640px){.x{display:none!important}}");
  });

  it("emits backdrop-filter with the Safari prefix", () => {
    const css = buildCss(".x", {}, { backdropFilter: "blur(12px)" });
    expect(css).toContain("-webkit-backdrop-filter:blur(12px)");
    expect(css).toContain("backdrop-filter:blur(12px)");
  });

  it("only uses backgroundImage URLs that pass validation", () => {
    expect(buildCss(".x", {}, { backgroundImage: "https://a.com/i.png" })).toContain('url("https://a.com/i.png")');
    expect(buildCss(".x", {}, { backgroundImage: "javascript:alert(1)" })).toBe("");
  });
});

describe("responsive", () => {
  it("cascades mobile ← tablet ← desktop", () => {
    expect(resolveResponsive({ desktop: 1, mobile: 3 })).toEqual({ desktop: 1, tablet: 1, mobile: 3 });
    expect(resolveResponsive("a")).toEqual({ desktop: "a", tablet: "a", mobile: "a" });
  });
  it("custom tokens override defaults", () => {
    expect(tokensToCssVars({ "color.primary": "#f06" })["--pp-color-primary"]).toBe("#f06");
  });
});
