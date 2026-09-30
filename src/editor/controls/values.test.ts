import { describe, expect, it } from "vitest";
import {
  formatBlur,
  formatBorder,
  formatColor,
  formatLength,
  formatSides,
  parseBlur,
  parseBorder,
  parseColor,
  parseLength,
  parseSides,
  isoToLocalInput,
  localInputToIso,
} from "./values";

describe("lengths", () => {
  it("parses numbers with units", () => {
    expect(parseLength("16px")).toEqual({ amount: 16, unit: "px" });
    expect(parseLength("1.5rem")).toEqual({ amount: 1.5, unit: "rem" });
    expect(parseLength("-4px")).toEqual({ amount: -4, unit: "px" });
  });

  it("returns null for values it cannot edit as a number", () => {
    for (const value of ["auto", "calc(100vw - 32px)", "token:spacing.md", "", "10"]) {
      expect(parseLength(value)).toBeNull();
    }
  });

  it("round-trips", () => {
    expect(formatLength({ amount: 50, unit: "%" })).toBe("50%");
  });
});

describe("sides", () => {
  it("expands CSS shorthand", () => {
    expect(parseSides("8px")).toEqual([8, 8, 8, 8]);
    expect(parseSides("8px 16px")).toEqual([8, 16, 8, 16]);
    expect(parseSides("1px 2px 3px")).toEqual([1, 2, 3, 2]);
    expect(parseSides("1px 2px 3px 4px")).toEqual([1, 2, 3, 4]);
  });

  it("treats an empty value as zero and rejects non-pixel values", () => {
    expect(parseSides(undefined)).toEqual([0, 0, 0, 0]);
    expect(parseSides("10%")).toBeNull();
    expect(parseSides("auto")).toBeNull();
  });

  it("writes the shortest form", () => {
    expect(formatSides([8, 8, 8, 8])).toBe("8px");
    expect(formatSides([8, 16, 8, 16])).toBe("8px 16px");
    expect(formatSides([1, 2, 3, 4])).toBe("1px 2px 3px 4px");
  });
});

describe("colors", () => {
  it("parses hex, rgba and theme tokens", () => {
    expect(parseColor("#fff")).toEqual({ hex: "#ffffff", alpha: 1 });
    expect(parseColor("#4F46E5")).toEqual({ hex: "#4f46e5", alpha: 1 });
    expect(parseColor("rgba(255, 255, 255, 0.18)")).toEqual({ hex: "#ffffff", alpha: 0.18 });
    expect(parseColor("token:color.primary")).toEqual({ hex: "#4f46e5", alpha: 1 });
  });

  it("returns null for colors it cannot show in a picker", () => {
    for (const value of ["red", "hsl(0, 0%, 0%)", "linear-gradient(red, blue)", "token:spacing.md", ""]) {
      expect(parseColor(value)).toBeNull();
    }
  });

  it("writes hex when opaque and rgba otherwise", () => {
    expect(formatColor({ hex: "#ff0000", alpha: 1 })).toBe("#ff0000");
    expect(formatColor({ hex: "#ff0000", alpha: 0.5 })).toBe("rgba(255, 0, 0, 0.5)");
  });
});

describe("borders", () => {
  it("parses and writes width, style and color", () => {
    expect(parseBorder("2px dashed #ff0000")).toEqual({ width: 2, style: "dashed", color: "#ff0000" });
    expect(formatBorder({ width: 1, style: "solid", color: "token:color.border" })).toBe("1px solid token:color.border");
    expect(parseBorder("none")).toBeNull();
  });
});

describe("blur", () => {
  it("reads the blur amount and keeps other filters when changing it", () => {
    expect(parseBlur("blur(14px) saturate(1.4)")).toBe(14);
    expect(parseBlur(undefined)).toBe(0);
    expect(formatBlur(20, "blur(14px) saturate(1.4)")).toBe("blur(20px) saturate(1.4)");
    expect(formatBlur(8, undefined)).toBe("blur(8px)");
    expect(formatBlur(0, "blur(14px)")).toBeUndefined();
  });
});

describe("date and time", () => {
  it("round-trips through the local date-time input without drifting", () => {
    const local = "2030-03-09T14:30";
    const iso = localInputToIso(local)!;
    expect(isoToLocalInput(iso)).toBe(local);
  });

  it("handles empty and invalid values", () => {
    expect(isoToLocalInput(undefined)).toBe("");
    expect(isoToLocalInput("nonsense")).toBe("");
    expect(localInputToIso("")).toBeUndefined();
  });
});
