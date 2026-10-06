import { describe, expect, it } from "vitest";
import {
  DAILY_DIFFICULTY,
  HINT_COST,
  INITIAL_HINTS,
  MAX_DAILY_MP,
  MISSION_POOL,
  MP_REWARDS,
} from "../src/application/rules";

describe("approved product rules", () => {
  it("uses the approved Monday-to-Sunday daily difficulty curve", () => {
    expect([1, 2, 3, 4, 5, 6, 0].map((day) => DAILY_DIFFICULTY[day])).toEqual([
      "easy", "medium", "hard", "expert", "hard", "medium", "easy",
    ]);
  });

  it("caps the ordinary daily MP sources at 20", () => {
    expect(
      MP_REWARDS.dailyChallenge + MP_REWARDS.categoryA + MP_REWARDS.categoryB + MP_REWARDS.completeAll,
    ).toBe(MAX_DAILY_MP);
  });

  it("starts with ten hints and charges one per use", () => {
    expect(INITIAL_HINTS).toBe(10);
    expect(HINT_COST).toBe(1);
  });

  it("contains only the approved mission pool", () => {
    expect(Object.keys(MISSION_POOL)).toEqual(["A01", "A02", "A03", "B01", "B03"]);
  });
});
