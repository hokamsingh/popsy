// Consumer check: server-render every example, then mount the multi-offer popup in a DOM and click a card.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
const fixtures = JSON.parse(readFileSync(process.argv[2], "utf8"));
const React = (await import("react")).default;
const { renderToString } = await import("react-dom/server");
const { PopupRenderer, parsePopup } = await import("@popsy/runtime");
const h = React.createElement;
console.log("react", React.version);

const errors = [];
const origError = console.error;
console.error = (...a) => errors.push(a.map(String).join(" ").slice(0, 200));

for (const [name, popup] of Object.entries(fixtures)) {
  if (!parsePopup(popup).success) throw new Error(`invalid fixture ${name}`);
  const html = renderToString(h(PopupRenderer, { popup, mode: "inline" }));
  if (!html.includes("data-pp-dialog")) throw new Error(`SSR produced no dialog for ${name}`);
}
console.log("ssr ok:", Object.keys(fixtures).length, "examples");

const dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, getComputedStyle: dom.window.getComputedStyle, requestAnimationFrame: (f) => setTimeout(f, 0), cancelAnimationFrame: clearTimeout });
globalThis.IS_REACT_ACT_ENVIRONMENT = false;
const { createRoot } = await import("react-dom/client");
const calls = [];
let dismissed = false;
let finish;
const root = createRoot(document.body.appendChild(document.createElement("div")));
root.render(h(PopupRenderer, {
  popup: fixtures["multi-offer"],
  variables: { headline: "Packs", items: [{ id: 1, title: "A", amount: "1", price: "$1", tag: "x" }, { id: 2, title: "B", amount: "2", price: "$2", tag: "y" }] },
  actions: { handlers: { avail: (p) => { calls.push(p); return new Promise((r) => (finish = r)); } } },
  onDismiss: () => { dismissed = true; },
}));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(50);
const buttons = [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("Avail"));
if (buttons.length !== 2) throw new Error(`expected 2 Avail buttons, got ${buttons.length}`);
buttons[1].click();
await wait(20);
if (buttons[1].getAttribute("aria-busy") !== "true") throw new Error("button not busy while the app works");
finish();
await wait(50);
if (JSON.stringify(calls) !== JSON.stringify([{ id: "2" }])) throw new Error("wrong payload " + JSON.stringify(calls));
if (!dismissed) throw new Error("popup did not close on success");
root.unmount();
console.error = origError;
const real = errors.filter((e) => !/Warning: useLayoutEffect does nothing on the server/.test(e));
console.log("dom ok: payload", JSON.stringify(calls), "closed", dismissed);
console.log("console errors:", real.length ? real : "none");
if (real.length) process.exit(1);
