import { describe, expect, it } from "vitest";
import { inheritedValue, withBreakpointValue } from "./responsive";

describe("withBreakpointValue", () => {
  it("keeps a plain value when only desktop is set", () => {
    expect(withBreakpointValue(undefined, "desktop", "16px")).toBe("16px");
  });

  it("adds a device override next to the desktop value", () => {
    expect(withBreakpointValue("16px", "mobile", "8px")).toEqual({ desktop: "16px", mobile: "8px" });
  });

  it("collapses back to a plain value when the last override is removed", () => {
    expect(withBreakpointValue({ desktop: "16px", mobile: "8px" }, "mobile", undefined)).toBe("16px");
  });

  it("clears everything when the only value is removed", () => {
    expect(withBreakpointValue("16px", "desktop", undefined)).toBeUndefined();
  });

  it("supports booleans", () => {
    expect(withBreakpointValue({ desktop: true }, "mobile", false)).toEqual({ desktop: true, mobile: false });
  });
});

describe("inheritedValue", () => {
  it("has nothing to inherit on desktop", () => {
    expect(inheritedValue("16px", "desktop")).toBeUndefined();
  });

  it("falls back mobile to tablet, then desktop", () => {
    expect(inheritedValue({ desktop: "a", tablet: "b" }, "mobile")).toBe("b");
    expect(inheritedValue({ desktop: "a" }, "mobile")).toBe("a");
    expect(inheritedValue({ desktop: "a" }, "tablet")).toBe("a");
  });
});
