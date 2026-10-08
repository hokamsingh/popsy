import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PopupRenderer } from "./renderer";
import { createTemplater } from "./variables";
import { createEmptyPopup, parsePopup, type Popup, type PopupNode } from "@/schema/popup";
import { fromPuck, toPuck } from "@/editor/adapters/puck";
import { parseAppActions } from "@/editor/appActions";
import { multiOffer } from "@/templates/benchmarks";

const popupWith = (children: PopupNode[], variables: Popup["variables"] = []): Popup => ({ ...createEmptyPopup(), variables, children });

const card = (button: Record<string, unknown> = {}): PopupNode[] => [
  {
    id: "r",
    type: "repeater",
    props: { source: "items" },
    children: [
      { id: "t", type: "text", props: { content: "{{index}}. {{item.title}} {{item.price}}" } },
      { id: "b", type: "button", props: { label: "Avail {{item.title}}", action: { type: "event", name: "avail", payload: { id: "{{item.id}}" }, ...button } } },
    ],
  },
];

describe("list variables", () => {
  it("reads lists from the host, then the declared sample", () => {
    const declared = [{ name: "items", sample: [{ a: 1 }] }];
    expect(createTemplater({ declared }).list("items")).toEqual([{ a: 1 }]);
    expect(createTemplater({ declared, values: { items: [{ a: 2 }, { a: 3 }] } }).list("items")).toHaveLength(2);
    expect(createTemplater({ values: { items: "nope" } }).list("items")).toEqual([]);
  });

  it("reaches list items by position and scopes item values", () => {
    const t = createTemplater({ values: { items: [{ title: "A" }, { title: "B" }] } });
    expect(t.text("{{items.1.title}}")).toBe("B");
    expect(t.scope({ item: { title: "C" } }).text("{{item.title}} / {{items.0.title}}")).toBe("C / A");
  });
});

describe("Repeater", () => {
  it("renders one copy per item with its own values", () => {
    render(<PopupRenderer popup={popupWith(card())} mode="inline" variables={{ items: [{ id: 1, title: "Starter", price: "$5" }, { id: 2, title: "Mega", price: "$50" }] }} />);
    expect(screen.getByText("1. Starter $5")).toBeTruthy();
    expect(screen.getByText("2. Mega $50")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("falls back to the sample list, honours the limit and shows empty text", () => {
    const sample = [{ title: "S1" }, { title: "S2" }, { title: "S3" }];
    const limited = card();
    limited[0].props.limit = 2;
    const { unmount } = render(<PopupRenderer popup={popupWith(limited, [{ name: "items", defaultValue: "", sample }])} mode="inline" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    unmount();
    const empty = card();
    empty[0].props.emptyText = "Nothing yet";
    render(<PopupRenderer popup={popupWith(empty)} mode="inline" variables={{ items: [] }} />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
  });

  it("sends each button's own item to the app", async () => {
    const avail = vi.fn();
    render(<PopupRenderer popup={popupWith(card())} mode="inline" variables={{ items: [{ id: 7, title: "A" }, { id: 9, title: "B" }] }} actions={{ handlers: { avail } }} />);
    fireEvent.click(screen.getByRole("button", { name: "Avail B" }));
    await waitFor(() => expect(avail).toHaveBeenCalledWith({ id: "9" }));
  });
});

describe("buttons that wait for the app", () => {
  const items = { items: [{ id: 1, title: "A" }] };

  it("shows busy while the app works, then the success message", async () => {
    let finish!: () => void;
    const avail = () => new Promise<void>((resolve) => (finish = resolve));
    render(<PopupRenderer popup={popupWith(card({ successMessage: "Done!" }))} mode="inline" variables={items} actions={{ handlers: { avail } }} />);
    const button = screen.getByRole("button", { name: "Avail A" });
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"));
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish());
    await waitFor(() => expect(button.textContent).toContain("Done!"));
  });

  it("shows the failure message when the app throws", async () => {
    const avail = () => Promise.reject(new Error("card declined"));
    render(<PopupRenderer popup={popupWith(card({ errorMessage: "Couldn't start" }))} mode="inline" variables={items} actions={{ handlers: { avail }, onError: () => {} }} />);
    const button = screen.getByRole("button", { name: "Avail A" });
    fireEvent.click(button);
    await waitFor(() => expect(button.textContent).toContain("Couldn't start"));
  });

  it("closes the popup on success when asked, and stays put when the person backs out", async () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <PopupRenderer popup={popupWith(card({ onSuccess: "close" }))} mode="inline" variables={items} onDismiss={onDismiss} actions={{ handlers: { avail: async () => {} } }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Avail A" }));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
    unmount();

    const stay = vi.fn();
    render(<PopupRenderer popup={popupWith(card({ onSuccess: "close" }))} mode="inline" variables={items} onDismiss={stay} actions={{ handlers: { avail: async () => false } }} />);
    const button = screen.getByRole("button", { name: "Avail A" });
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
    expect(stay).not.toHaveBeenCalled();
    expect(button.textContent).toContain("Avail A");
  });
});

describe("schema, editor and examples", () => {
  it("validates repeaters, list samples and action outcomes", () => {
    expect(parsePopup(popupWith(card({ onSuccess: "close", successMessage: "Yay" }))).success).toBe(true);
    expect(parsePopup(popupWith(card({ onSuccess: "explode" }))).success).toBe(false);
    expect(parsePopup({ ...popupWith([]), variables: [{ name: "items.0", sample: [] }] }).success).toBe(false);
  });

  it("round-trips the multi-offer example through the editor, sample list included", () => {
    const parsed = parsePopup(multiOffer());
    if (!parsed.success) throw new Error(JSON.stringify(parsed.errors));
    const back = fromPuck(toPuck(parsed.data));
    expect(back).toMatchObject({ success: true, data: { variables: parsed.data.variables } });
  });

  it("reads the optional app actions list and ignores bad input", () => {
    expect(parseAppActions('[{"name":"avail","label":"Avail offer","fields":["id"]}]')).toEqual([{ name: "avail", label: "Avail offer", fields: ["id"] }]);
    expect(parseAppActions('[{"name":"bad name"}]')).toEqual([]);
    expect(parseAppActions("not json")).toEqual([]);
    expect(parseAppActions(undefined)).toEqual([]);
  });
});

describe("close this popup first", () => {
  const items = { items: [{ id: 1, title: "A" }] };

  it("closes the popup before the app runs, and shows no progress", async () => {
    const order: string[] = [];
    const onDismiss = vi.fn(() => order.push("closed"));
    const avail = vi.fn(async () => {
      order.push("app");
    });
    render(<PopupRenderer popup={popupWith(card({ closeFirst: true }))} mode="inline" variables={items} onDismiss={onDismiss} actions={{ handlers: { avail } }} />);
    const button = screen.getByRole("button", { name: "Avail A" });
    fireEvent.click(button);
    await waitFor(() => expect(avail).toHaveBeenCalledWith({ id: "1" }));
    expect(order).toEqual(["closed", "app"]);
    expect(button.getAttribute("aria-busy")).toBeNull();
  });

  it("still closes when the app has no handler or fails", async () => {
    const onDismiss = vi.fn();
    render(
      <PopupRenderer popup={popupWith(card({ closeFirst: true }))} mode="inline" variables={items} onDismiss={onDismiss} actions={{ handlers: { avail: () => Promise.reject(new Error("nope")) }, onError: () => {} }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Avail A" }));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
  });

  it("is saved in the document and validated", () => {
    expect(parsePopup(popupWith(card({ closeFirst: true }))).success).toBe(true);
    expect(parsePopup(popupWith(card({ closeFirst: "yes" }))).success).toBe(false);
  });
});
