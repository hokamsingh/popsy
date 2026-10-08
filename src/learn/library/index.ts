import { TRACKS, type Challenge, type TrackId } from "../types";
import { BASICS } from "./basics";
import { DYNAMIC } from "./dynamic";
import { LAYOUT } from "./layout";
import { POLISH } from "./polish";

export const CHALLENGES: Challenge[] = [...BASICS, ...LAYOUT, ...POLISH, ...DYNAMIC];

export const getChallenge = (id: string): Challenge | undefined => CHALLENGES.find((c) => c.id === id);

export const challengesIn = (track: TrackId) => CHALLENGES.filter((c) => c.track === track);

/** The next challenge after this one in library order, if any. */
export const nextChallenge = (id: string): Challenge | undefined => {
  const i = CHALLENGES.findIndex((c) => c.id === id);
  return i >= 0 ? CHALLENGES[i + 1] : undefined;
};

export { TRACKS };
