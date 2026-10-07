import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PopupRenderer } from "./renderer";
import { createTemplater, fillAction, protectTokens, variablesIn } from "./variables";
import { createEmptyPopup, parsePopup, type Popup, type PopupNode } from "@/schema/popup";
import { fromPuck, toPuck } from "@/editor/adapters/puck";

describe("templater", () => {
  const t = createTemplater({
    values: { title: "Summer Sale", discount: 20, user: { firstName: "Asha", lastName: "" }, live: true },
    declared: [{ name: "city", defaultValue: "your city" }, { name: "title", defaultValue: "Hello" }],
  });

  it("fills plain, nested, numeric and boolean values", () => {
    expect(t.text("{{title}}: {{discount}}% off, {{ user.firstName }}! ({{live}})")).toBe("Summer Sale: 20% off, Asha! (true)");
  });

  it("prefers the site's value, then the inline fallback, then the declared default, then blank", () => {
    expect(t.text("{{title|x}}")).toBe("Summer Sale");
    expect(t.text("Hi {{user.lastName | there}}")).toBe("Hi there");
    expect(t.text("In {{city}}")).toBe("In your city");
    expect(t.text("[{{missing}}]")).toBe("[]");
    expect(createTemplater({ keepMissing: true }).text("[{{missing}}]")).toBe("[{{missing}}]");
  });

  it("only reads own, plain values, never prototype or object values", () => {
    expect(t.text("{{constructor}}{{user.toString}}{{user}}")).toBe("");
  });

  it("leaves text without valid tokens alone", () => {
    expect(t.text("{ title } {{ 1bad }} {{title")).toBe("{ title } {{ 1bad }} {{title");
  });

  it("encodes values inside URLs but takes a whole-URL variable as is", () => {
    const u = createTemplater({ values: { q: "a b&c", link: "https://x.com/p?a=1" } });
    expect(u.url("https://shop.com/search?q={{q}}")).toBe("https://shop.com/search?q=a%20b%26c");
    expect(u.url(" {{link}} ")).toBe("https://x.com/p?a=1");
  });

  it("lists the variables a template uses", () => {
    expect(variablesIn("{{a}} {{ b.c | x }} {{a}}")).toEqual(["a", "b.c"]);
  });

  it("protects tokens from other parsers and restores them", () => {
    const { masked, restore } = protectTokens("**{{first__name}}** and {{x}}");
    expect(masked).not.toContain("{{");
    expect(restore(masked)).toBe("**{{first__name}}** and {{x}}");
  });

  it("fills action links and event payloads", () => {
    const u = createTemplater({ values: { id: "p 1", page: "/deals" } });
    expect(fillAction({ type: "navigate", to: "{{page}}" }, u)).toEqual({ type: "navigate", to: "/deals" });
    expect(fillAction({ type: "external_url", url: "https://x.com/{{id}}" }, u)).toMatchObject({ url: "https://x.com/p%201" });
    expect(fillAction({ type: "event", name: "buy", payload: { id: "{{id}}", n: 1, tags: ["{{id}}"] } }, u)).toEqual({
      type: "event",
      name: "buy",
      payload: { id: "p 1", n: 1, tags: ["p 1"] },
    });
  });
});

const popupWith = (children: PopupNode[], extra: Partial<Popup> = {}): Popup => ({ ...createEmptyPopup(), ...extra, children });

describe("variables in the renderer", () => {
  it("fills text, buttons, badges and the dialog title", () => {
    const popup = popupWith(
      [
        { id: "t", type: "text", props: { content: "Hi {{name|friend}}, {{title}}" } },
        { id: "b", type: "button", props: { label: "Get {{discount}}% off" } },
        { id: "g", type: "badge", props: { text: "{{tag}}" } },
      ],
      { settings: { ...createEmptyPopup().settings, title: "{{title}} popup" }, variables: [{ name: "tag", defaultValue: "New" }] },
    );
    render(<PopupRenderer popup={popup} variables={{ title: "Summer Sale", discount: 20 }} />);
    expect(screen.getByText("Hi friend, Summer Sale")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get 20% off" })).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Summer Sale popup" })).toBeTruthy();
  });

  it("keeps values as plain text in rich text and blocks unsafe links", () => {
    const popup = popupWith([{ id: "r", type: "richtext", props: { content: "Hello **{{name}}**, [open]({{link}})" } }]);
    const { container } = render(
      <PopupRenderer popup={popup} mode="inline" variables={{ name: "<b>x</b> [evil](https://evil.com)", link: "javascript:alert(1)" }} />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("<b>x</b> [evil](https://evil.com)");
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("open");
  });

  it("drops an image source that becomes unsafe after filling", () => {
    const popup = popupWith([{ id: "i", type: "image", props: { src: "{{img}}", alt: "{{alt}}" } }]);
    const { container } = render(<PopupRenderer popup={popup} mode="inline" variables={{ img: "javascript:alert(1)", alt: "Shoe" }} />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBeNull();
    expect(img?.getAttribute("alt")).toBe("Shoe");
  });

  it("fills a button's link before running it", () => {
    const navigate = vi.fn();
    const popup = popupWith([{ id: "b", type: "button", props: { label: "Go", action: { type: "navigate", to: "/p/{{id}}" } } }]);
    render(<PopupRenderer popup={popup} mode="inline" variables={{ id: 42 }} actions={{ navigate }} />);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(navigate).toHaveBeenCalledWith("/p/42");
  });
});

describe("variables in the schema and editor", () => {
  it("rejects bad and duplicate names", () => {
    const bad = parsePopup({ ...createEmptyPopup(), variables: [{ name: "1st" }] });
    expect(bad.success).toBe(false);
    const dup = parsePopup({ ...createEmptyPopup(), variables: [{ name: "a" }, { name: "a" }] });
    expect(dup.success).toBe(false);
  });

  it("defaults to no variables for popups saved before variables existed", () => {
    const { variables, ...old } = createEmptyPopup();
    void variables;
    const parsed = parsePopup(old);
    expect(parsed.success && parsed.data.variables).toEqual([]);
  });

  it("round-trips through the editor and skips rows without a name", () => {
    const popup = { ...createEmptyPopup(), variables: [{ name: "user.firstName", defaultValue: "there" }] };
    const data = toPuck(popup);
    expect(fromPuck(data)).toMatchObject({ success: true, data: { variables: popup.variables } });
    data.root.props = { ...data.root.props, variables: [...popup.variables, { name: " ", defaultValue: "x" }] };
    expect(fromPuck(data)).toMatchObject({ success: true, data: { variables: popup.variables } });
  });
});
