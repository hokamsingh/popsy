import { describe, expect, it } from "vitest";
import { createEmptyPopup, parsePopup } from "./popup";
import { isSafeAssetUrl, isSafeCssValue, isSafeLinkUrl } from "./validation";
import { BENCHMARKS } from "@/templates/benchmarks";

const doc = (children: unknown[], extra: Record<string, unknown> = {}) => ({
  version: 1,
  type: "popup",
  children,
  ...extra,
});

describe("parsePopup", () => {
  it("accepts an empty popup and applies setting defaults", () => {
    const r = parsePopup(createEmptyPopup());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.settings.position).toBe("center");
  });

  it("round-trips through JSON deterministically", () => {
    const first = parsePopup(BENCHMARKS.announcement());
    expect(first.success).toBe(true);
    if (!first.success) return;
    const second = parsePopup(JSON.parse(JSON.stringify(first.data)));
    expect(second).toEqual(first);
  });

  it("rejects unknown component types with a path", () => {
    const r = parsePopup(doc([{ id: "a", type: "bonus-popup", props: {} }]));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors[0]).toMatchObject({ path: "children[0].type" });
  });

  it("rejects children on leaf components", () => {
    const r = parsePopup(
      doc([{ id: "a", type: "text", props: { content: "x" }, children: [{ id: "b", type: "text", props: {} }] }]),
    );
    expect(r.success).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const r = parsePopup(
      doc([
        { id: "a", type: "spacer", props: {} },
        { id: "a", type: "spacer", props: {} },
      ]),
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors[0].message).toMatch(/duplicate/);
  });

  it("rejects invalid props, reporting the nested path", () => {
    const r = parsePopup(doc([{ id: "a", type: "button", props: { action: { type: "navigate", to: "javascript:alert(1)" } } }]));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors[0].path).toBe("children[0].props.action.to");
  });

  it("rejects unsafe CSS in styles", () => {
    const r = parsePopup(doc([{ id: "a", type: "section", props: {}, style: { background: "red; } body { display:none" } }]));
    expect(r.success).toBe(false);
  });

  it("accepts responsive values and rejects unknown breakpoints", () => {
    const ok = parsePopup(doc([{ id: "a", type: "section", props: {}, style: { padding: { desktop: "32px", mobile: "16px" } } }]));
    expect(ok.success).toBe(true);
    const bad = parsePopup(doc([{ id: "a", type: "section", props: {}, style: { padding: { watch: "1px" } } }]));
    expect(bad.success).toBe(false);
  });

  it("rejects documents from a newer version", () => {
    const r = parsePopup({ version: 99, type: "popup", children: [] });
    expect(r.success).toBe(false);
  });

  it("rejects non-objects and missing versions", () => {
    expect(parsePopup(null).success).toBe(false);
    expect(parsePopup({ type: "popup" }).success).toBe(false);
  });

  it("rejects invalid custom token names", () => {
    expect(parsePopup(doc([], { settings: { tokens: { "Bad Name": "red" } } })).success).toBe(false);
  });
});

describe("validators", () => {
  it.each(["https://a.com", "/relative", "mailto:a@b.co", "tel:+123", "?tab=2"])("allows link %s", (u) => {
    expect(isSafeLinkUrl(u)).toBe(true);
  });
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)", "data:text/html,<b>", "vbscript:x", ""])(
    "blocks link %j",
    (u) => expect(isSafeLinkUrl(u)).toBe(false),
  );
  it("allows image data URIs only for asset URLs", () => {
    expect(isSafeAssetUrl("data:image/png;base64,iVBOR")).toBe(true);
    expect(isSafeAssetUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(isSafeAssetUrl("mailto:a@b.co")).toBe(false);
  });
  it("blocks CSS breakouts", () => {
    for (const v of ["a;b", "a}b", "url(x)", "expression(1)", "a\\b", "/*x*/"]) expect(isSafeCssValue(v)).toBe(false);
    expect(isSafeCssValue("linear-gradient(135deg, #fff, rgba(0,0,0,.5))")).toBe(true);
    expect(isSafeCssValue("token:color.primary")).toBe(true);
  });
});

describe("benchmark fixtures", () => {
  it.each(Object.entries(BENCHMARKS))("%s is a valid canonical popup", (_, make) => {
    const r = parsePopup(make());
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.success).toBe(true);
  });
});
