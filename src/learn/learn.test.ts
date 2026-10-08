import { describe, expect, it } from "vitest";
import { createBlankPopup } from "@/templates/blank";
import { parsePopup, type Popup, type PopupNode } from "@/schema/popup";
import { CHALLENGES, challengesIn, getChallenge, nextChallenge, TRACKS } from "./library";
import { allNodes, deriveObjectives } from "./objectives";
import { checkObjectives, objectivesFor, parseTarget, scoreAttempt, stars } from "./scoring";
import { textSimilarity, valueSimilarity } from "./similarity";
import { HINT_COST, PASS_SCORE, type Challenge } from "./types";

const clone = (popup: Popup): Popup => structuredClone(popup);
const blank = () => {
  const parsed = parsePopup(createBlankPopup());
  if (!parsed.success) throw new Error("blank popup invalid");
  return parsed.data;
};
const edit = (challenge: Challenge, change: (popup: Popup) => void) => {
  const popup = clone(parseTarget(challenge));
  change(popup);
  return popup;
};
const firstOf = (popup: Popup, type: string): PopupNode => {
  const node = allNodes(popup.children).find((n) => n.type === type);
  if (!node) throw new Error(`no ${type}`);
  return node;
};

describe("the library", () => {
  it("has a large, well-formed set of challenges", () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
    for (const track of TRACKS) expect(challengesIn(track.id).length).toBeGreaterThanOrEqual(7);
    expect(new Set(CHALLENGES.map((c) => c.level))).toEqual(new Set([1, 2, 3, 4]));
    for (const c of CHALLENGES) {
      expect(c.title.length, c.id).toBeGreaterThan(2);
      expect(c.brief.length, c.id).toBeGreaterThan(30);
      expect(c.hints.length, c.id).toBe(3);
      expect(c.learn.length, c.id).toBeGreaterThan(0);
    }
  });

  it("walks from one challenge to the next", () => {
    expect(nextChallenge(CHALLENGES[0].id)).toBe(CHALLENGES[1]);
    expect(nextChallenge(CHALLENGES[CHALLENGES.length - 1].id)).toBeUndefined();
    expect(getChallenge("hello-popup")?.title).toBe("Hello, popup");
    expect(getChallenge("nope")).toBeUndefined();
  });

  it.each(CHALLENGES.map((c) => [c.id, c] as const))("%s: a valid target that scores a perfect 100 against itself", (_, challenge) => {
    const target = parseTarget(challenge);
    const objectives = objectivesFor(challenge);
    expect(objectives.length).toBeGreaterThanOrEqual(3);
    expect(objectives.length).toBeLessThanOrEqual(18);
    expect(new Set(objectives.map((o) => o.id)).size).toBe(objectives.length);
    const failing = checkObjectives(challenge, target).filter((o) => !o.passed).map((o) => o.label);
    expect(failing).toEqual([]);
    const result = scoreAttempt(challenge, clone(target), 0);
    expect(result.similarity.overall).toBeCloseTo(1, 10);
    expect(result.score).toBe(100);
    expect(result.stars).toBe(3);
  });

  it.each(CHALLENGES.map((c) => [c.id, c] as const))("%s: an empty popup doesn't pass", (_, challenge) => {
    const result = scoreAttempt(challenge, blank(), 0);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(50);
  });
});

describe("similarity", () => {
  it("treats case and spacing as the same words, and typos as close", () => {
    expect(textSimilarity("Hello,  World!", "hello, world!")).toBe(1);
    expect(textSimilarity("Claim offer", "Claim ofer")).toBeGreaterThan(0.85);
    expect(textSimilarity("Claim offer", "Buy now")).toBeLessThan(0.4);
  });

  it("compares colours by how they look, lengths by size, and per-device values by device", () => {
    expect(valueSimilarity("#0f172a", "#0f172b", "background")).toBe(1);
    expect(valueSimilarity("#0f172a", "#fbbf24", "background")).toBeLessThan(0.5);
    expect(valueSimilarity("rgba(255,255,255,0.18)", "rgba(255,255,255,0.2)", "background")).toBeGreaterThan(0.9);
    expect(valueSimilarity("24px", "26px", "radius")).toBe(1);
    expect(valueSimilarity("24px", "48px", "radius")).toBe(0.5);
    expect(valueSimilarity({ desktop: "44px", mobile: "30px" }, { desktop: "44px", mobile: "30px" }, "fontSize")).toBe(1);
    expect(valueSimilarity({ desktop: "44px", mobile: "30px" }, "44px", "fontSize")).toBeLessThan(1);
    expect(valueSimilarity("https://a.com/x.png", "https://b.com/y.png", "src")).toBe(0.5);
  });
});

describe("scoring", () => {
  const hello = getChallenge("hello-popup")!;

  it("gives most of the credit for a small typo", () => {
    const attempt = edit(hello, (p) => {
      firstOf(p, "text").props.content = "Hello, wrold!";
    });
    const result = scoreAttempt(hello, attempt, 0);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(100);
    expect(result.objectives.some((o) => !o.passed)).toBe(false);
    expect(result.similarity.tips.join(" ")).toContain("Hello, wrold!");
  });

  it("scores less and less as blocks go missing", () => {
    const scores = [0, 1, 2, 3].map((removed) =>
      scoreAttempt(
        hello,
        edit(hello, (p) => {
          const stack = firstOf(p, "stack");
          stack.children = stack.children!.slice(0, 3 - removed);
        }),
        0,
      ).score,
    );
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(new Set(scores).size).toBe(4);
  });

  it("notices a wrong action and a wrong colour", () => {
    const night = getChallenge("night-mode")!;
    const wrongAction = edit(night, (p) => {
      firstOf(p, "button").props.action = { type: "external_url", url: "https://example.com", newTab: true };
    });
    expect(checkObjectives(night, wrongAction).find((o) => o.label.includes("closes the popup"))?.passed).toBe(false);
    const wrongColour = edit(night, (p) => {
      p.settings.background = "#fbbf24";
    });
    expect(checkObjectives(night, wrongColour).find((o) => o.label.startsWith("Set the popup’s background"))?.passed).toBe(false);
    const closeColour = edit(night, (p) => {
      p.settings.background = "#0f172b";
    });
    expect(checkObjectives(night, closeColour).find((o) => o.label.startsWith("Set the popup’s background"))?.passed).toBe(true);
  });

  it("charges for hints but never goes below zero", () => {
    const perfect = scoreAttempt(hello, clone(parseTarget(hello)), 2);
    expect(perfect.rawScore).toBe(100);
    expect(perfect.hintPenalty).toBe(2 * HINT_COST);
    expect(perfect.score).toBe(100 - 2 * HINT_COST);
    expect(scoreAttempt(hello, blank(), 99).score).toBe(0);
  });

  it("awards stars at the right marks", () => {
    expect([0, 49, 50, 69, PASS_SCORE, 89, 90, 100].map(stars)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it("checks list, fallback and limit objectives that the derived list can't express", () => {
    const fallbacks = getChallenge("safe-fallbacks")!;
    const noFallback = edit(fallbacks, (p) => {
      firstOf(p, "text").props.content = "Hello, {{firstName}}!";
    });
    expect(checkObjectives(fallbacks, noFallback).find((o) => o.id === "fallback:firstName")?.passed).toBe(false);

    const board = getChallenge("leaderboard")!;
    const noLimit = edit(board, (p) => {
      delete firstOf(p, "repeater").props.limit;
    });
    expect(checkObjectives(board, noLimit).find((o) => o.id === "limit:3")?.passed).toBe(false);
  });

  it("works out the checklist from the finished popup", () => {
    const labels = deriveObjectives(parseTarget(getChallenge("checkout-handoff")!)).map((o) => o.label);
    expect(labels).toContain("Add a Repeater block");
    expect(labels).toContain("A button tells your app “open_checkout”");
    expect(labels).toContain("…and it closes the popup first");
    expect(labels).toContain("…and it sends “id” to your app");
    expect(labels).toContain("Repeat a block over “packs”");
  });
});
