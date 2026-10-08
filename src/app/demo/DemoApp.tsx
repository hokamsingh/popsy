"use client";
// This page plays "your website": it uses the published npm package, exactly as a host app would.
import { PopupRenderer, parsePopup, type ActionRuntimeOptions } from "@popsy-render/runtime";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadPopup } from "@/editor/storage";
import { BENCHMARKS } from "@/templates/benchmarks";
import styles from "./demo.module.css";

type Outcome = "checkout-page" | "checkout-popup" | "succeed" | "fail" | "back-out";

const OUTCOMES: { value: Outcome; label: string; group: string }[] = [
  { value: "checkout-page", label: "Open a checkout page", group: "Close the Popsy popup, then…" },
  { value: "checkout-popup", label: "Open a checkout popup", group: "Close the Popsy popup, then…" },
  { value: "succeed", label: "Succeed after 1 second", group: "Keep the popup open (button shows progress) and…" },
  { value: "fail", label: "Fail after 1 second", group: "Keep the popup open (button shows progress) and…" },
  { value: "back-out", label: "The person backs out", group: "Keep the popup open (button shows progress) and…" },
];

const SNIPPET_HANDLERS: Record<Outcome, string> = {
  "checkout-page": `avail: ({ id }) => {
      setOpen(false);                          // close the Popsy popup first
      router.push(\`/checkout?package=\${id}\`); // then your own checkout page
    },`,
  "checkout-popup": `avail: async ({ id }) => {
      setOpen(false);                          // close the Popsy popup first
      return openCheckoutModal(id);            // then your own checkout popup
    },`,
  succeed: `avail: async ({ id }) => api.claim(id), // resolves: button shows success`,
  fail: `avail: async ({ id }) => api.claim(id), // throws: button shows the failure message`,
  "back-out": `avail: async ({ id }) => false,      // false: the person backed out, button resets`,
};

const SAVED = "__saved";
const PASTED = "__pasted";

const STARTING_VALUES = {
  headline: "Hand-picked for you",
  firstName: "Asha",
  discount: 25,
  category: "slots",
  items: [
    { id: 101, title: "Starter", amount: "1,000 coins", price: "$2.99", tag: "New" },
    { id: 102, title: "Popular", amount: "5,000 coins", price: "$9.99", tag: "Best value" },
    { id: 103, title: "Mega", amount: "25,000 coins", price: "$39.99", tag: "+30% bonus" },
  ],
};

interface PendingAction {
  kind: "page" | "popup";
  name: string;
  payload: Record<string, unknown> | undefined;
  resolve: (outcome: "done" | "cancelled" | "failed") => void;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every app-action name a popup's buttons and countdowns can send. */
function appActionNames(value: unknown, names = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => appActionNames(v, names));
  else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.type === "event" && typeof record.name === "string") names.add(record.name);
    Object.values(record).forEach((v) => appActionNames(v, names));
  }
  return names;
}

export default function DemoApp() {
  const [source, setSource] = useState("multi-offer");
  const [pasted, setPasted] = useState("");
  const [valuesText, setValuesText] = useState(() => JSON.stringify(STARTING_VALUES, null, 2));
  const [outcome, setOutcome] = useState<Outcome>("checkout-page");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const outcomeRef = useRef(outcome);
  useEffect(() => {
    outcomeRef.current = outcome;
  }, [outcome]);

  const note = useCallback((line: string) => setLog((lines) => [`${new Date().toLocaleTimeString()}  ${line}`, ...lines].slice(0, 12)), []);

  const raw = useMemo<unknown>(() => {
    if (source === SAVED) return loadPopup();
    if (source === PASTED) {
      try {
        return JSON.parse(pasted);
      } catch {
        return null;
      }
    }
    return BENCHMARKS[source]?.();
  }, [source, pasted]);

  const parsed = useMemo(() => (raw ? parsePopup(raw) : null), [raw]);

  const values = useMemo<{ ok: true; value: Record<string, unknown> } | { ok: false }>(() => {
    try {
      const value: unknown = JSON.parse(valuesText);
      return value && typeof value === "object" && !Array.isArray(value) ? { ok: true, value: value as Record<string, unknown> } : { ok: false };
    } catch {
      return { ok: false };
    }
  }, [valuesText]);

  // What "your app" does when a popup button asks it to act. Popsy waits on the promise.
  const handle = useCallback(
    async (name: string, payload: Record<string, unknown> | undefined) => {
      note(`app action: ${name} ${payload ? JSON.stringify(payload) : ""}`);
      const mode = outcomeRef.current;
      if (mode === "succeed") {
        await wait(1000);
        note(`${name}: succeeded`);
        return undefined;
      }
      if (mode === "fail") {
        await wait(1000);
        throw new Error(`${name}: your app reported a failure`);
      }
      if (mode === "back-out") {
        await wait(600);
        note(`${name}: person backed out`);
        return false;
      }
      // Your app takes over: close the Popsy popup, then show its own checkout.
      setOpen(false);
      note("your app closed the popup");
      const kind = mode === "checkout-page" ? "page" : "popup";
      const result = await new Promise<"done" | "cancelled" | "failed">((resolve) => setPending({ kind, name, payload, resolve }));
      note(`${name}: ${result === "done" ? "paid" : result === "failed" ? "card declined" : "cancelled"}`);
      if (kind === "page") setReceipt(result === "done" ? "Payment complete. Your coins are on their way." : result === "failed" ? "Your card was declined." : "Checkout cancelled.");
      setPending(null);
      return result === "done" ? undefined : false;
    },
    [note],
  );

  const actionNames = useMemo(() => [...appActionNames(raw)].sort().join(","), [raw]);
  const actions = useMemo<Omit<ActionRuntimeOptions, "onDismiss">>(
    () => ({
      navigate: (to) => note(`navigate to ${to}`),
      openUrl: (url) => note(`open ${url}`),
      onError: (message) => note(`failed: ${message}`),
      handlers: Object.fromEntries(actionNames.split(",").filter(Boolean).map((name) => [name, (payload: Record<string, unknown> | undefined) => handle(name, payload)])),
    }),
    [actionNames, handle, note],
  );

  const onDismiss = useCallback(() => {
    setOpen(false);
    note("popup closed");
  }, [note]);

  const variables = values.ok ? values.value : undefined;
  const snippet = `import { PopupRenderer } from "@popsy-render/runtime";

<PopupRenderer
  popup={popupFromYourBackend}
  variables={${values.ok ? JSON.stringify(Object.fromEntries(Object.entries(values.value).map(([k, v]) => [k, Array.isArray(v) ? `[…${v.length} items]` : v]))) : "{ … }"}}
  actions={{ handlers: {
    ${SNIPPET_HANDLERS[outcome]}
  } }}
  onDismiss={() => setOpen(false)}
/>`;

  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <span className={styles.siteLogo}>Your website</span>
        <span className={styles.siteNote}>This page installs @popsy-render/runtime from npm, like your site would.</span>
        <nav className={styles.siteNav}>
          <Link href="/">Home</Link>
          <Link href="/editor">Editor</Link>
        </nav>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="demo-controls">
          <h1 id="demo-controls" className={styles.title}>
            Integration demo
          </h1>

          <label className={styles.field}>
            <span>Popup</span>
            <select value={source} onChange={(e) => {
                setSource(e.target.value);
                setOpen(true);
              }}>
              {Object.keys(BENCHMARKS).map((id) => (
                <option key={id} value={id}>
                  Example: {id}
                </option>
              ))}
              <option value={SAVED}>My saved popup (from the editor)</option>
              <option value={PASTED}>Paste exported JSON…</option>
            </select>
          </label>
          {source === PASTED && (
            <textarea className={styles.code} rows={6} placeholder='{"version":1,"type":"popup",…}' value={pasted} onChange={(e) => setPasted(e.target.value)} spellCheck={false} />
          )}
          {parsed && !parsed.success && (
            <ul className={styles.errors}>
              {parsed.errors.slice(0, 5).map((e) => (
                <li key={`${e.path}${e.message}`}>
                  {e.path || "popup"}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {source === PASTED && !raw && pasted && <p className={styles.errors}>That isn&apos;t valid JSON.</p>}

          <label className={styles.field}>
            <span>Values your site sends (variables)</span>
            <textarea className={styles.code} rows={10} value={valuesText} onChange={(e) => setValuesText(e.target.value)} spellCheck={false} />
          </label>
          {!values.ok && <p className={styles.errors}>Variables must be a JSON object.</p>}

          <label className={styles.field}>
            <span>When a button asks your app to act</span>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
              {[...new Set(OUTCOMES.map((o) => o.group))].map((group) => (
                <optgroup key={group} label={group}>
                  {OUTCOMES.filter((o) => o.group === group).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <button type="button" className={styles.primary} onClick={() => {
              setOpen(true);
              note("popup opened");
            }}>
            Open popup
          </button>

          <h2 className={styles.subtitle}>What your app received</h2>
          <ol className={styles.log} aria-live="polite">
            {log.length ? log.map((line, i) => <li key={i}>{line}</li>) : <li className={styles.muted}>Click a button in the popup.</li>}
          </ol>

          <h2 className={styles.subtitle}>The code on your site</h2>
          <pre className={styles.snippet}>{snippet}</pre>
        </section>

        <section className={styles.stage} aria-label="Your website's page">
          <div className={styles.fakeContent} aria-hidden>
            <div />
            <div />
            <div />
          </div>
        </section>
      </div>

      {parsed?.success && <PopupRenderer popup={parsed.data} open={open} onDismiss={onDismiss} variables={variables} actions={actions} />}

      {pending?.kind === "popup" && (
        <div className={styles.checkoutBackdrop}>
          <div className={styles.checkout} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <h2 id="checkout-title">Your checkout popup</h2>
            <p>
              The Popsy popup closed first. Your app received <code>{pending.name}</code> with <code>{JSON.stringify(pending.payload ?? {})}</code>.
            </p>
            <CheckoutButtons onResult={pending.resolve} />
          </div>
        </div>
      )}

      {(pending?.kind === "page" || receipt) && (
        <div className={styles.checkoutPage} role="main" aria-labelledby="checkout-page-title">
          <header className={styles.siteHeader}>
            <span className={styles.siteLogo}>Your website</span>
            <span className={styles.siteNote}>/checkout{pending?.payload?.id !== undefined ? `?package=${String(pending.payload.id)}` : ""}</span>
          </header>
          <div className={styles.checkoutPageBody}>
            <h1 id="checkout-page-title">Checkout</h1>
            {pending ? (
              <>
                <p>
                  The popup closed and your app opened its checkout page for <code>{JSON.stringify(pending.payload ?? {})}</code>.
                </p>
                <CheckoutButtons onResult={pending.resolve} />
              </>
            ) : (
              <>
                <p>{receipt}</p>
                <button type="button" className={styles.primary} onClick={() => setReceipt(null)}>
                  Back to the site
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutButtons({ onResult }: { onResult: PendingAction["resolve"] }) {
  return (
    <div className={styles.checkoutButtons}>
      <button type="button" className={styles.primary} onClick={() => onResult("done")}>
        Pay
      </button>
      <button type="button" onClick={() => onResult("failed")}>
        Card declined
      </button>
      <button type="button" onClick={() => onResult("cancelled")}>
        Cancel
      </button>
    </div>
  );
}
