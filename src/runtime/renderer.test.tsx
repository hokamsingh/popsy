import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PopupRenderer } from "./renderer";
import { BENCHMARKS } from "@/templates/benchmarks";
import { createEmptyPopup, type Popup } from "@/schema/popup";

describe("PopupRenderer", () => {
  it.each(Object.entries(BENCHMARKS))("renders %s in overlay and inline modes", (_, make) => {
    const { container, unmount } = render(<PopupRenderer popup={make()} />);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    unmount();
    const inline = render(<PopupRenderer popup={make()} mode="inline" />);
    expect(inline.container.querySelector('[role="dialog"]')).toBeNull();
    expect(inline.container.querySelector("[data-pp-dialog]")).not.toBeNull();
  });

  it("renders nothing and reports errors for an invalid document", () => {
    const onInvalid = vi.fn();
    const { container } = render(<PopupRenderer popup={{ version: 1, type: "popup", children: [{ id: "x", type: "nope", props: {} }] }} onInvalid={onInvalid} />);
    expect(container.innerHTML).toBe("");
    expect(onInvalid).toHaveBeenCalled();
  });

  it("dialog is labelled and modal", () => {
    render(<PopupRenderer popup={BENCHMARKS.announcement()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("dismisses on Escape, overlay click, and close button", () => {
    const onDismiss = vi.fn();
    const { container } = render(<PopupRenderer popup={BENCHMARKS.announcement()} onDismiss={onDismiss} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.mouseDown(container.querySelector("[data-pp-root]")!);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it("does not dismiss on Escape when disabled", () => {
    const onDismiss = vi.fn();
    const popup: Popup = { ...BENCHMARKS.announcement(), settings: { ...BENCHMARKS.announcement().settings, closeOnEscape: false } };
    render(<PopupRenderer popup={popup} onDismiss={onDismiss} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("clicking a dismiss button dismisses; event buttons reach host handlers", () => {
    const onDismiss = vi.fn();
    const claim = vi.fn();
    const { rerender } = render(<PopupRenderer popup={BENCHMARKS.announcement()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onDismiss).toHaveBeenCalledOnce();

    rerender(<PopupRenderer popup={BENCHMARKS["product-card"]()} actions={{ handlers: { add_to_cart: claim } }} />);
    fireEvent.click(screen.getByRole("button", { name: /Add to cart/ }));
    expect(claim).toHaveBeenCalledWith({ sku: "trail-runner" });
  });

  it("actions are inert while editing", () => {
    const onDismiss = vi.fn();
    render(<PopupRenderer popup={BENCHMARKS.announcement()} onDismiss={onDismiss} editing />);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("returns nothing when closed", () => {
    const { container } = render(<PopupRenderer popup={createEmptyPopup()} open={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("emits scoped responsive CSS per node and never inline HTML from rich text", () => {
    const { container } = render(<PopupRenderer popup={BENCHMARKS["two-column-promotion"]()} />);
    const css = [...container.querySelectorAll("style")].map((s) => s.textContent).join("");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("grid-template-columns:1fr 1fr");
    expect(container.querySelector("script")).toBeNull();
  });

  it("escapes markup typed into text", () => {
    const popup: Popup = {
      ...createEmptyPopup(),
      children: [{ id: "t", type: "text", props: { content: "<img src=x onerror=alert(1)>" } }],
    };
    const { container } = render(<PopupRenderer popup={popup} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
  });

  it("traps focus: Tab from the last focusable wraps to the first", () => {
    render(<PopupRenderer popup={BENCHMARKS["product-card"]()} />);
    const buttons = screen.getAllByRole("button");
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(buttons[buttons.length - 1], { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("keeps styles separate when two popups on one page reuse the same node ids", () => {
    const red: Popup = { ...createEmptyPopup(), children: [{ id: "a", type: "text", props: { content: "red" }, style: { color: "red" } }] };
    const blue: Popup = { ...createEmptyPopup(), children: [{ id: "a", type: "text", props: { content: "blue" }, style: { color: "blue" } }] };
    const { container } = render(
      <>
        <PopupRenderer popup={red} mode="inline" />
        <PopupRenderer popup={blue} mode="inline" />
      </>,
    );
    const [first, second] = [...container.querySelectorAll('[data-pp="text"]')];
    expect(first.className).not.toBe(second.className);
  });

  it("floats blocks on a Layers parent, but not the same block elsewhere", () => {
    const badge = { id: "b", type: "badge", props: { text: "New" }, style: { anchor: "top-left", offsetX: "16px" } } as const;
    const onLayer: Popup = { ...createEmptyPopup(), children: [{ id: "l", type: "layers", props: {}, children: [badge] }] };
    const inStack: Popup = { ...createEmptyPopup(), children: [{ id: "s", type: "stack", props: {}, children: [{ ...badge }] }] };
    const cssOf = (popup: Popup) => {
      const { container, unmount } = render(<PopupRenderer popup={popup} mode="inline" />);
      const css = [...container.querySelectorAll("style")].map((node) => node.textContent).join("");
      unmount();
      return css;
    };
    expect(cssOf(onLayer)).toContain("justify-self:start");
    expect(cssOf(inStack)).not.toContain("justify-self");
  });

  it("only the direct children of Layers float, not what is inside them", () => {
    const text = { id: "t", type: "text", props: { content: "Hi" }, style: { offsetX: "33px" } } as const;
    const popup: Popup = {
      ...createEmptyPopup(),
      children: [{ id: "l", type: "layers", props: {}, children: [{ id: "s", type: "stack", props: {}, children: [text] }] }],
    };
    const { container } = render(<PopupRenderer popup={popup} mode="inline" />);
    const css = [...container.querySelectorAll("style")].map((node) => node.textContent).join("");
    expect(css).toMatch(/:has\(> \.pp-[^)]*-s\)/);
    expect(css).not.toMatch(/:has\(> \.pp-[^)]*-t\)/);
  });

  it("lets a popup drop its card and recolour the close button", () => {
    const popup: Popup = {
      ...createEmptyPopup(),
      settings: { ...createEmptyPopup().settings, background: "transparent", shadow: "none", closeButtonColor: "#ffffff" },
    };
    const { container } = render(<PopupRenderer popup={popup} />);
    const dialog = container.querySelector("[data-pp-dialog]") as HTMLElement;
    expect(dialog.style.background).toContain("transparent");
    expect(dialog.style.getPropertyValue("--pp-close-color")).toBe("#ffffff");
  });
});

