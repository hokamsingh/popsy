import { parsePopup, type Popup } from "@/schema/popup";
import { deriveObjectives } from "./objectives";
import { compareDocuments, type Similarity } from "./similarity";
import { HINT_COST, PASS_SCORE, type Challenge, type Objective } from "./types";

export const objectivesFor = (challenge: Challenge): Objective[] => {
  const base = challenge.objectives ?? deriveObjectives(parseTarget(challenge));
  return [...base, ...(challenge.extraObjectives ?? [])];
};

const targetCache = new Map<string, Popup>();

/** The finished popup of a challenge, validated the same way as anything a person builds. */
export function parseTarget(challenge: Challenge): Popup {
  const cached = targetCache.get(challenge.id);
  if (cached) return cached;
  const parsed = parsePopup(challenge.build());
  if (!parsed.success) throw new Error(`Challenge "${challenge.id}" has an invalid target: ${parsed.errors.map((e) => `${e.path} ${e.message}`).join("; ")}`);
  targetCache.set(challenge.id, parsed.data);
  return parsed.data;
}

export interface ObjectiveResult {
  id: string;
  label: string;
  passed: boolean;
}

export const checkObjectives = (challenge: Challenge, attempt: Popup): ObjectiveResult[] =>
  objectivesFor(challenge).map(({ id, label, passed }) => ({ id, label, passed: passed(attempt) }));

export const stars = (score: number) => (score >= 90 ? 3 : score >= PASS_SCORE ? 2 : score >= 50 ? 1 : 0);

export interface ScoreResult {
  /** Final score, 0 to 100, after hint costs. */
  score: number;
  /** Score before hint costs. */
  rawScore: number;
  hintPenalty: number;
  stars: number;
  passed: boolean;
  objectives: ObjectiveResult[];
  similarity: Similarity;
}

/** 60% for the checklist, 40% for how alike the popups are, minus a small cost per hint used. */
export function scoreAttempt(challenge: Challenge, attempt: Popup, hintsUsed: number): ScoreResult {
  const objectives = checkObjectives(challenge, attempt);
  const similarity = compareDocuments(parseTarget(challenge), attempt);
  const fraction = objectives.length ? objectives.filter((o) => o.passed).length / objectives.length : 1;
  const rawScore = Math.round(100 * (0.6 * fraction + 0.4 * similarity.overall));
  const hintPenalty = Math.min(rawScore, hintsUsed * HINT_COST);
  const score = rawScore - hintPenalty;
  return { score, rawScore, hintPenalty, stars: stars(score), passed: score >= PASS_SCORE, objectives, similarity };
}
