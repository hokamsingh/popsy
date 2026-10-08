import type { Popup } from "@/schema/popup";

export type Level = 1 | 2 | 3 | 4;

export const LEVELS: Record<Level, { name: string; blurb: string }> = {
  1: { name: "Starter", blurb: "Words, images and buttons" },
  2: { name: "Builder", blurb: "Layout, colour and type" },
  3: { name: "Designer", blurb: "Position, effects and devices" },
  4: { name: "Pro", blurb: "Variables, lists and app actions" },
};

export const TRACKS = [
  { id: "basics", name: "Basics", blurb: "Your first popups: text, images, buttons and links." },
  { id: "layout", name: "Layout & style", blurb: "Columns, rows, colours, fonts and media." },
  { id: "polish", name: "Position & polish", blurb: "Corners, glass, layers, timers and phones." },
  { id: "dynamic", name: "Dynamic popups", blurb: "Personalise with variables, lists and app actions." },
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];

/** One thing the finished popup must do. Checked live while building, and again when scoring. */
export interface Objective {
  id: string;
  label: string;
  passed: (attempt: Popup) => boolean;
}

export interface Challenge {
  id: string;
  track: TrackId;
  level: Level;
  title: string;
  /** What to build, in a sentence or two. */
  brief: string;
  /** What this challenge teaches, as short phrases. */
  learn: string[];
  /** Hints from gentle to specific. Each one used costs points. */
  hints: string[];
  /** Links or values the brief mentions that can't be read off the picture. */
  assets?: { label: string; value: string }[];
  /** The popup to build. */
  build: () => Popup;
  /** Replaces the objectives worked out from the popup, when those aren't the right ones. */
  objectives?: Objective[];
  /** Extra objectives added to the worked-out ones. */
  extraObjectives?: Objective[];
}

export const HINT_COST = 5;
export const PASS_SCORE = 70;
