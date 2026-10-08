import { stars } from "./scoring";
import { PASS_SCORE } from "./types";

const PROGRESS_KEY = "popsy:learn:v1";
const WORK_PREFIX = "popsy:learn:work:v1:";

export interface ChallengeResult {
  best: number;
  stars: number;
  attempts: number;
  /** ISO time of the best score. */
  at: string;
}

export type Progress = Record<string, ChallengeResult>;

/** A person's unfinished attempt: the editor's data and how many hints they have looked at. */
export interface SavedWork {
  data: unknown;
  hints: number;
}

const isResult = (v: unknown): v is ChallengeResult => {
  const r = v as ChallengeResult;
  return !!r && typeof r.best === "number" && typeof r.stars === "number" && typeof r.attempts === "number" && typeof r.at === "string";
};

export const loadProgress = (): Progress => parseProgress(readProgressText());

export const PROGRESS_EVENT = "popsy:learn:changed";

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage can be unavailable (private windows); progress just isn't kept.
  }
}

/** The raw saved text, used to notice changes (here or in another tab). */
export function readProgressText(): string {
  try {
    return localStorage.getItem(PROGRESS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseProgress(text: string): Progress {
  try {
    const raw = JSON.parse(text || "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => isResult(v))) as Progress;
  } catch {
    return {};
  }
}

/** Adds one scored attempt, keeping the best score. Returns the new progress and whether it was a new best. */
export function recordAttempt(progress: Progress, id: string, score: number, now = new Date()): { progress: Progress; improved: boolean } {
  const before = progress[id];
  const improved = !before || score > before.best;
  const result: ChallengeResult = improved
    ? { best: score, stars: stars(score), attempts: (before?.attempts ?? 0) + 1, at: now.toISOString() }
    : { ...before, attempts: before.attempts + 1 };
  return { progress: { ...progress, [id]: result }, improved };
}

export interface Summary {
  completed: number;
  stars: number;
}

export function summarize(progress: Progress, ids: string[]): Summary {
  return ids.reduce<Summary>(
    (sum, id) => {
      const r = progress[id];
      return r ? { completed: sum.completed + (r.best >= PASS_SCORE ? 1 : 0), stars: sum.stars + r.stars } : sum;
    },
    { completed: 0, stars: 0 },
  );
}

export function loadWork(id: string): SavedWork | null {
  try {
    const raw = JSON.parse(localStorage.getItem(WORK_PREFIX + id) ?? "null") as SavedWork | null;
    return raw && typeof raw === "object" && "data" in raw && typeof raw.hints === "number" ? raw : null;
  } catch {
    return null;
  }
}

export function saveWork(id: string, work: SavedWork): void {
  try {
    localStorage.setItem(WORK_PREFIX + id, JSON.stringify(work));
  } catch {
    // See saveProgress.
  }
}

export function clearWork(id: string): void {
  try {
    localStorage.removeItem(WORK_PREFIX + id);
  } catch {
    // See saveProgress.
  }
}
