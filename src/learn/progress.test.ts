import { beforeEach, describe, expect, it } from "vitest";
import { clearWork, loadProgress, loadWork, recordAttempt, saveProgress, saveWork, summarize } from "./progress";

const at = new Date("2026-10-08T12:00:00Z");

describe("progress", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the best score and counts every attempt", () => {
    let progress = {};
    let step = recordAttempt(progress, "a", 60, at);
    expect(step.improved).toBe(true);
    expect(step.progress.a).toEqual({ best: 60, stars: 1, attempts: 1, at: at.toISOString() });
    step = recordAttempt(step.progress, "a", 40, new Date("2026-10-09T00:00:00Z"));
    expect(step.improved).toBe(false);
    expect(step.progress.a).toEqual({ best: 60, stars: 1, attempts: 2, at: at.toISOString() });
    step = recordAttempt(step.progress, "a", 95, at);
    expect(step.progress.a).toMatchObject({ best: 95, stars: 3, attempts: 3 });
    progress = step.progress;
    expect(Object.keys(progress)).toEqual(["a"]);
  });

  it("saves, loads and ignores damaged data", () => {
    saveProgress({ a: { best: 80, stars: 2, attempts: 1, at: at.toISOString() } });
    expect(loadProgress().a.best).toBe(80);
    localStorage.setItem("popsy:learn:v1", JSON.stringify({ a: { best: 80, stars: 2, attempts: 1, at: "x" }, b: "nope", c: { best: "high" } }));
    expect(Object.keys(loadProgress())).toEqual(["a"]);
    localStorage.setItem("popsy:learn:v1", "{not json");
    expect(loadProgress()).toEqual({});
  });

  it("totals completed challenges (70 and up) and stars", () => {
    const progress = {
      a: { best: 95, stars: 3, attempts: 1, at: "x" },
      b: { best: 70, stars: 2, attempts: 2, at: "x" },
      c: { best: 55, stars: 1, attempts: 1, at: "x" },
    };
    expect(summarize(progress, ["a", "b", "c", "d"])).toEqual({ completed: 2, stars: 6 });
    expect(summarize(progress, ["c"])).toEqual({ completed: 0, stars: 1 });
  });

  it("saves unfinished work per challenge and clears it", () => {
    expect(loadWork("a")).toBeNull();
    saveWork("a", { data: { content: [] }, hints: 2 });
    expect(loadWork("a")).toEqual({ data: { content: [] }, hints: 2 });
    expect(loadWork("b")).toBeNull();
    clearWork("a");
    expect(loadWork("a")).toBeNull();
    localStorage.setItem("popsy:learn:work:v1:z", JSON.stringify({ data: 1 }));
    expect(loadWork("z")).toBeNull();
  });
});
