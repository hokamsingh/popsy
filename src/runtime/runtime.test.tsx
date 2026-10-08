import { describe, expect, it, vi } from "vitest";
import { createActionRuntime } from "./actions";
import { parseRichText } from "./richtext";

describe("action runtime", () => {
  it("dispatches dismiss", async () => {
    const onDismiss = vi.fn();
    await createActionRuntime({ onDismiss }).run({ type: "dismiss" });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("routes events to registered domain handlers with payload", async () => {
    const claim = vi.fn();
    const rt = createActionRuntime({ handlers: { claim_bonus: claim } });
    await rt.run({ type: "event", name: "claim_bonus", payload: { id: 1 } });
    expect(claim).toHaveBeenCalledWith({ id: 1 });
  });

  it("supports late registration and unregistration", async () => {
    const h = vi.fn();
    const onError = vi.fn();
    const rt = createActionRuntime({ onError });
    const off = rt.register("x", h);
    await rt.run({ type: "event", name: "x" });
    off();
    await rt.run({ type: "event", name: "x" });
    expect(h).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("falls back to onEvent for unregistered events", async () => {
    const onEvent = vi.fn();
    await createActionRuntime({ onEvent }).run({ type: "event", name: "continue" });
    expect(onEvent).toHaveBeenCalledWith("continue", undefined);
  });

  it("blocks unsafe URLs even if a document slipped past validation", async () => {
    const openUrl = vi.fn();
    const navigate = vi.fn();
    const onError = vi.fn();
    const rt = createActionRuntime({ openUrl, navigate, onError });
    await rt.run({ type: "external_url", url: "javascript:alert(1)" });
    await rt.run({ type: "navigate", to: "javascript:alert(1)" });
    expect(openUrl).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("opens safe URLs in a new tab by default and navigates", async () => {
    const openUrl = vi.fn();
    const navigate = vi.fn();
    const rt = createActionRuntime({ openUrl, navigate });
    await rt.run({ type: "external_url", url: "https://a.com" });
    await rt.run({ type: "navigate", to: "/pricing" });
    expect(openUrl).toHaveBeenCalledWith("https://a.com", true);
    expect(navigate).toHaveBeenCalledWith("/pricing");
  });

  it("reports handler errors instead of throwing", async () => {
    const onError = vi.fn();
    const rt = createActionRuntime({
      onError,
      handlers: { boom: () => { throw new Error("nope"); } },
    });
    await expect(rt.run({ type: "event", name: "boom" })).resolves.toBe("failed");
    expect(onError).toHaveBeenCalledWith("nope", expect.anything());
  });
});

describe("rich text", () => {
  it("parses inline formatting and nesting", () => {
    const [p] = parseRichText("a **b *c*** __d__");
    expect(p.kind).toBe("paragraph");
    expect(JSON.stringify(p)).toContain('"kind":"bold"');
    expect(JSON.stringify(p)).toContain('"kind":"underline"');
  });

  it("parses lists and paragraphs", () => {
    const blocks = parseRichText("intro\n\n- one\n- two\n\nend");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "list", "paragraph"]);
    expect(blocks[1].kind === "list" && blocks[1].items).toHaveLength(2);
  });

  it("degrades unsafe links to plain text", () => {
    const out = JSON.stringify(parseRichText("[click](javascript:alert(1))"));
    expect(out).not.toContain("link");
    expect(out).toContain("click");
  });

  it("never produces raw HTML nodes", () => {
    const out = JSON.stringify(parseRichText("<script>alert(1)</script>"));
    expect(out).toContain("<script>"); // kept as inert text, rendered by React as a string
    expect(out).not.toContain('"kind":"html"');
  });
});
