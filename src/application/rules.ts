import type { Difficulty } from "../core/types";

export const INITIAL_HINTS = 10;
export const HINT_COST = 1;
export const REWARDED_AD_HINTS = 3;
export const MAX_DAILY_MP = 20;

export const DAILY_DIFFICULTY: Readonly<Record<number, Difficulty>> = {
  0: "easy",
  1: "easy",
  2: "medium",
  3: "hard",
  4: "expert",
  5: "hard",
  6: "medium",
};

export const MISSION_POOL = {
  A01: { category: "A", minimumDifficulty: "medium" },
  A02: { category: "A", minimumDifficulty: "hard" },
  A03: { category: "A", minimumDifficulty: "expert" },
  B01: { category: "B", condition: "no-hint" },
  B03: { category: "B", condition: "no-mistake" },
} as const;

export const MP_REWARDS = {
  dailyChallenge: 5,
  categoryA: 5,
  categoryB: 5,
  completeAll: 5,
  stampMilestone: 15,
} as const;
