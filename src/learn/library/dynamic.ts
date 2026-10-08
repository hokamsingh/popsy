import { multiOffer, personalized } from "@/templates/benchmarks";
import { dismiss, fontStack, n, popup, sec } from "../dsl";
import type { Challenge, Objective } from "../types";
import { allNodes, textsOf } from "../objectives";

const hasFallback = (name: string): Objective => ({
  id: `fallback:${name}`,
  label: `Give “${name}” a fallback, like {{${name}|friend}}`,
  passed: (a) => textsOf(a).some((t) => new RegExp(`\\{\\{\\s*${name}\\s*\\|[^}]+\\}\\}`).test(t)),
});

const showsAtMost = (count: number): Objective => ({
  id: `limit:${count}`,
  label: `Show at most ${count} items`,
  passed: (a) => allNodes(a.children).some((x) => x.type === "repeater" && Number(x.props.limit) > 0 && Number(x.props.limit) <= count),
});

export const DYNAMIC: Challenge[] = [
  {
    id: "personalised",
    track: "dynamic",
    level: 4,
    title: "Personal touch",
    brief: "Greet each player by name and fill in their discount and favourite category, using variables.",
    learn: ["Variables", "{{name}} in text", "Defaults for the preview"],
    hints: [
      "Open Page settings → Variables and add firstName, discount and category, each with a default.",
      "In any text, write {{firstName}} wherever the name should appear. “Insert a variable…” does the typing for you.",
      "Button labels and event data can use variables too: the button tells your app shop_category and sends category = {{category}}.",
    ],
    build: personalized,
  },
  {
    id: "safe-fallbacks",
    track: "dynamic",
    level: 4,
    title: "Safe fallbacks",
    brief: "Say hello with a name that falls back to “friend” when your site doesn't know it, and a discount that falls back to 10.",
    learn: ["{{name|fallback}}", "Missing values"],
    hints: [
      "Add variables firstName and discount. Leave their defaults empty.",
      "After the name, add a bar and a fallback inside the braces, without spaces.",
      "Heading: Hello, {{firstName|friend}}! Text: Your {{discount|10}}% welcome gift is waiting.",
    ],
    extraObjectives: [hasFallback("firstName"), hasFallback("discount")],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "12px" }, undefined, [
          n("text", { content: "Hello, {{firstName|friend}}!", variant: "heading" }),
          n("text", { content: "Your {{discount|10}}% welcome gift is waiting." }),
          n("button", { label: "Open my gift", action: dismiss }),
        ])),
      ], [
        { name: "firstName", defaultValue: "" },
        { name: "discount", defaultValue: "" },
      ]),
  },
  {
    id: "button-feedback",
    track: "dynamic",
    level: 4,
    title: "Buttons that wait",
    brief: "A button that asks your app to claim a gift, then shows “Gift added!” if it worked or “Couldn't claim. Try again.” if it failed.",
    learn: ["App actions", "Success and failure messages", "Spinner while waiting"],
    hints: [
      "Choose “Tell your app (custom signal)” and name it claim_gift.",
      "Further down the action settings you can type a message for when it worked and one for when it failed.",
      "While your app works the button shows a spinner on its own. You only supply the two messages.",
    ],
    build: () =>
      popup({}, () => [
        sec(n("stack", { gap: "12px", align: "center" }, undefined, [
          n("text", { content: "Claim your gift", variant: "heading", align: "center" }),
          n("text", { content: "One tap and it's yours.", align: "center" }),
          n("button", { label: "Claim gift", action: { type: "event", name: "claim_gift", successMessage: "Gift added!", errorMessage: "Couldn't claim. Try again." } }),
        ])),
      ]),
  },
  {
    id: "offer-list",
    track: "dynamic",
    level: 4,
    title: "List of offers",
    brief: "Show three offer cards from one list. Each card has a tag, title, amount and price, and its own Avail button that sends that card's id to your app.",
    learn: ["List variables", "Repeater", "{{item.title}}", "Per-item buttons"],
    hints: [
      "Add a variable called items and switch it to List; paste sample items as JSON with id, title, amount, price and tag.",
      "Add a Repeater and choose items as its list. Design one card inside it; the rest copy it.",
      "Inside the card write {{item.title}}, {{item.price}} and so on. The button sends id = {{item.id}} to your app as avail, and closes the popup when it worked.",
    ],
    build: multiOffer,
  },
  {
    id: "checkout-handoff",
    track: "dynamic",
    level: 4,
    title: "Hand off to checkout",
    brief: "Packs in a two-column list where each Buy button closes the popup first, then asks your app to open its own checkout for that pack.",
    learn: ["Close this popup first", "Item data in actions", "Popups that never stack"],
    hints: [
      "Add a list variable called packs with two sample items, and a Repeater with 2 columns.",
      "On each button choose “Tell your app” and name it open_checkout. Send id = {{item.id}}.",
      "Turn on “Close this popup first” so your app's checkout never opens on top of this popup.",
    ],
    build: () =>
      popup({ width: "560px" }, () => [
        sec(n("stack", { gap: "16px" }, undefined, [
          n("text", { content: "Choose a pack", variant: "heading" }),
          n("repeater", { source: "packs", columns: "2", gap: "12px" }, undefined, [
            n("stack", { gap: "6px" }, { padding: "16px", border: "1px solid token:color.border", radius: "token:radius.md" }, [
              n("text", { content: "{{item.title}}", variant: "subheading" }),
              n("text", { content: "{{item.price}}" }),
              n("button", { label: "Buy", fullWidth: true, action: { type: "event", name: "open_checkout", payload: { id: "{{item.id}}" }, closeFirst: true } }),
            ]),
          ]),
        ])),
      ], [
        {
          name: "packs",
          defaultValue: "",
          sample: [
            { id: 1, title: "Starter", price: "$4.99" },
            { id: 2, title: "Popular", price: "$14.99" },
          ],
        },
      ]),
  },
  {
    id: "leaderboard",
    track: "dynamic",
    level: 4,
    title: "Top three",
    brief: "A leaderboard from a list: show only the first three rows, number them, and show “No scores yet” when the list is empty.",
    learn: ["Repeater limit", "{{index}}", "Empty text"],
    hints: [
      "Add a list variable scores, then a Repeater with one column using it.",
      "Set “Show at most” to 3 and fill in “Text when the list is empty”.",
      "Each row is a Row with space between: {{index}}. {{item.name}} on the left and {{item.score}} on the right.",
    ],
    extraObjectives: [showsAtMost(3)],
    build: () =>
      popup({ width: "400px" }, () => [
        sec(n("stack", { gap: "12px" }, undefined, [
          n("text", { content: "Leaderboard", variant: "heading" }),
          n("repeater", { source: "scores", columns: "1", gap: "8px", limit: 3, emptyText: "No scores yet" }, undefined, [
            n("flex", { justify: "between", align: "center" }, { padding: "8px 0" }, [
              n("text", { content: "{{index}}. {{item.name}}", variant: "label" }),
              n("text", { content: "{{item.score}}" }),
            ]),
          ]),
        ])),
      ], [
        {
          name: "scores",
          defaultValue: "",
          sample: [
            { name: "Alice", score: "980" },
            { name: "Ben", score: "940" },
            { name: "Chen", score: "910" },
            { name: "Dara", score: "870" },
          ],
        },
      ]),
  },
  {
    id: "tournament",
    track: "dynamic",
    level: 4,
    title: "Join the tournament",
    brief: "A live-event popup: badge, a name and prize pool from variables, a 2-hour timer, and a Join button that sends the tournament name and closes the popup when it worked.",
    learn: ["Variables + timers", "Event data", "Closing on success"],
    hints: [
      "Add variables tournament and prizePool. Use {{tournament}} in the heading and {{prizePool}} in the text.",
      "A Countdown that starts when the popup opens (120 minutes, no days) tells your app registration_closed when it ends.",
      "Join now tells your app join_tournament, sends tournament = {{tournament}}, and closes the popup when it worked, with a success message.",
    ],
    build: () =>
      popup({ width: "480px" }, () => [
        sec(n("stack", { gap: "14px", align: "center" }, undefined, [
          n("badge", { text: "Live now", icon: "trophy", variant: "solid" }),
          n("text", { content: "{{tournament}}", variant: "heading", align: "center" }),
          n("text", { content: "Prize pool: {{prizePool}} coins", align: "center" }),
          n("countdown", { mode: "duration", durationMinutes: 120, showDays: false, endText: "Registration closed", onEnd: { type: "event", name: "registration_closed" } }),
          n("button", { label: "Join now", size: "lg", action: { type: "event", name: "join_tournament", payload: { tournament: "{{tournament}}" }, onSuccess: "close", successMessage: "You're in!" } }),
        ])),
      ], [
        { name: "tournament", defaultValue: "Weekend Championship" },
        { name: "prizePool", defaultValue: "250,000" },
      ]),
  },
  {
    id: "vip-capstone",
    track: "dynamic",
    level: 4,
    title: "VIP upgrade (capstone)",
    brief: "Put it all together: a frosted VIP card with the player's name, a list of perks in columns that stack on phones, and a Claim button that closes the popup when your app says it worked.",
    learn: ["Everything so far", "Glass + variables + lists + actions"],
    hints: [
      "Start with the popup: transparent background, no shadow, Fade entrance, a blurred page behind, and Oswald as the heading font.",
      "Variables: firstName and a list called perks (title and detail). A Repeater with 3 columns on desktop and 1 on mobile shows them.",
      "The glass is a Stack with a translucent white background, blur and border. The button is full width, tells your app claim_perks, closes the popup on success and has both messages.",
    ],
    build: () =>
      popup(
        {
          width: "560px",
          background: "transparent",
          shadow: "none",
          overlayBlur: "blur(8px)",
          animation: "fade",
          tokens: { "font.heading": fontStack("oswald") },
        },
        () => [
          n("section", {}, { padding: "24px", gradient: "linear-gradient(135deg, #4f46e5, #ec4899)", radius: "token:radius.lg" }, [
            n("stack", { gap: "16px", align: "stretch" }, {
              padding: "24px",
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.35)",
              radius: "token:radius.lg",
              color: "#ffffff",
            }, [
              n("badge", { text: "VIP upgrade", icon: "crown", variant: "outline" }, { color: "#ffffff", border: "1px solid rgba(255,255,255,0.6)" }),
              n("text", { content: "Congrats, {{firstName}}!", variant: "heading" }),
              n("repeater", { source: "perks", columns: { desktop: "3", mobile: "1" }, gap: "12px" }, undefined, [
                n("stack", { gap: "4px" }, { padding: "12px", background: "rgba(255,255,255,0.14)", radius: "token:radius.md" }, [
                  n("text", { content: "{{item.title}}", variant: "label" }),
                  n("text", { content: "{{item.detail}}", variant: "caption" }),
                ]),
              ]),
              n("button", {
                label: "Claim my perks",
                fullWidth: true,
                action: { type: "event", name: "claim_perks", onSuccess: "close", successMessage: "Welcome to VIP!", errorMessage: "Couldn't claim. Try again." },
              }, { background: "#ffffff", color: "#0f172a" }),
            ]),
          ]),
        ],
        [
          { name: "firstName", defaultValue: "Asha" },
          {
            name: "perks",
            defaultValue: "",
            sample: [
              { title: "Faster payouts", detail: "Within 24 hours" },
              { title: "Weekly bonus", detail: "Every Monday" },
              { title: "Personal host", detail: "Chat any time" },
            ],
          },
        ],
      ),
  },
];
