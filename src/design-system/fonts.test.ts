import { describe, expect, it } from "vitest";
import { FONTS, findFontByReference, findFontByStack, fontTokenName, fontTokenReference } from "./fonts";
import { buildCss } from "./styles";
import { defaultTokens, isTokenName, tokensToCssVars } from "./tokens";
import { isSafeCssValue } from "@/schema/validation";

describe("font catalog", () => {
  it("has unique ids that are valid token names", () => {
    const ids = FONTS.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(isTokenName(fontTokenName(id))).toBe(true);
  });

  it("only contains stacks that are safe CSS values", () => {
    for (const font of FONTS) expect(isSafeCssValue(font.stack)).toBe(true);
  });

  it("makes every font available as a theme token and CSS variable", () => {
    for (const font of FONTS) {
      expect(defaultTokens[fontTokenName(font.id)]).toBe(font.stack);
      expect(tokensToCssVars()[`--pp-font-${font.id}`]).toBe(font.stack);
    }
  });

  it("looks fonts up by token reference and by stack", () => {
    const playfair = FONTS.find((font) => font.id === "playfair-display")!;
    expect(findFontByReference(fontTokenReference("playfair-display"))).toBe(playfair);
    expect(findFontByStack(playfair.stack)).toBe(playfair);
    expect(findFontByReference("Georgia")).toBeUndefined();
  });

  it("turns a chosen font into a font-family rule on a text block", () => {
    const css = buildCss(".x", { "font-family": fontTokenReference("lora") });
    expect(css).toBe(".x{font-family:var(--pp-font-lora)}");
  });
});
