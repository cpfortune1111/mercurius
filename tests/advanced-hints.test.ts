import { describe, expect, it } from "vitest";
import {
  findFishHint,
  findColorHint,
  findHiddenSubsetHint,
  findNakedSubsetHint,
  findWingHint,
  findXCycleHint,
} from "../src/core/advanced-hints";
import type { Digit, GameState } from "../src/core/types";

function stateWithNotes(entries: Record<number, readonly Digit[]>): GameState {
  return {
    schemaVersion: 1,
    puzzleId: "advanced-hint-test",
    mistakes: 0,
    completed: false,
    history: [],
    cells: Array.from({ length: 81 }, (_, index) => ({
      given: false,
      value: null,
      notes: entries[index] ?? [],
    })),
  };
}

describe("legacy advanced hint strategies", () => {
  it("finds and applies the same Naked Triplet eliminations", () => {
    const state = stateWithNotes({ 0: [1, 2], 1: [1, 3], 2: [2, 3], 3: [1, 4] });
    const hint = findNakedSubsetHint(state, 3);

    expect(hint?.strategy).toBe("naked-triplet");
    expect(hint?.edits).toContainEqual({ index: 3, notes: [4] });
  });

  it("finds and applies the same Hidden Triplet eliminations", () => {
    const state = stateWithNotes({
      0: [1, 2, 3, 4],
      1: [1, 2, 3, 5],
      2: [1, 2, 3, 6],
      3: [4, 5, 6],
    });
    const hint = findHiddenSubsetHint(state, 3);

    expect(hint?.strategy).toBe("hidden-triplet");
    expect(hint?.edits).toContainEqual({ index: 0, notes: [1, 2, 3] });
  });

  it("finds the legacy Naked Quad and Hidden Quad eliminations", () => {
    const naked = stateWithNotes({ 0: [1, 2], 1: [2, 3], 2: [3, 4], 3: [1, 4], 4: [1, 5] });
    const hidden = stateWithNotes({
      0: [1, 2, 5], 1: [2, 3, 6], 2: [3, 4, 7], 3: [1, 4, 8], 4: [5, 6, 7, 8],
    });

    expect(findNakedSubsetHint(naked, 4)?.edits).toContainEqual({ index: 4, notes: [5] });
    expect(findHiddenSubsetHint(hidden, 4)?.edits).toContainEqual({ index: 0, notes: [1, 2] });
  });

  it("finds a row-based X-Wing and removes the cover-column candidate", () => {
    const state = stateWithNotes({ 0: [5], 3: [5], 18: [5], 21: [5], 45: [5] });
    const hint = findFishHint(state, 2);

    expect(hint?.strategy).toBe("x-wing");
    expect(hint?.edits).toContainEqual({ index: 45, notes: [] });
  });

  it("finds the legacy Swordfish and Jellyfish patterns", () => {
    const swordfish = stateWithNotes({ 0: [5], 1: [5], 10: [5], 11: [5], 18: [5], 20: [5], 36: [5] });
    const jellyfish = stateWithNotes({ 0: [6], 1: [6], 10: [6], 11: [6], 20: [6], 21: [6], 27: [6], 30: [6], 45: [6] });

    expect(findFishHint(swordfish, 3)?.edits).toContainEqual({ index: 36, notes: [] });
    expect(findFishHint(jellyfish, 4)?.edits).toContainEqual({ index: 45, notes: [] });
  });

  it("keeps Color Trap and Color Wrap as separate legacy rules", () => {
    const trap = stateWithNotes({ 0: [1], 3: [1], 13: [1], 40: [1], 36: [1], 72: [1], 44: [1] });
    const wrap = stateWithNotes({ 0: [1], 9: [1], 10: [1] });

    expect(findColorHint(trap, false)?.edits).toContainEqual({ index: 36, notes: [] });
    expect(findColorHint(wrap, false)).toBeNull();
    expect(findColorHint(wrap, true)?.strategy).toBe("color-wrap");
  });

  it("finds an alternating X-Cycle elimination", () => {
    const state = stateWithNotes({ 0: [7], 3: [7], 9: [7], 27: [7], 30: [7], 57: [7], 63: [7] });
    const hint = findXCycleHint(state);

    expect(hint?.strategy).toBe("x-cycle");
    expect(hint?.edits).toContainEqual({ index: 9, notes: [] });
  });

  it("finds XY-Wing and XYZ-Wing intersection eliminations", () => {
    const xy = stateWithNotes({ 0: [1, 2], 1: [1, 3], 9: [2, 3], 10: [3] });
    const xyz = stateWithNotes({ 0: [1, 2, 3], 1: [1, 3], 9: [2, 3], 10: [3] });

    expect(findWingHint(xy, false)?.edits).toContainEqual({ index: 10, notes: [] });
    expect(findWingHint(xyz, true)?.edits).toContainEqual({ index: 10, notes: [] });
  });
});
