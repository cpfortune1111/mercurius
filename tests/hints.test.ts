import { describe, expect, it } from "vitest";
import { applyGameEdits, createGame, placeDigit } from "../src/core/game";
import { applySmartHint, findSmartHint } from "../src/core/hints";
import type { Digit, PuzzleDefinition } from "../src/core/types";

const solution = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
] as Digit[];

function puzzle(blankIndexes: number[]): PuzzleDefinition {
  return {
    schemaVersion: 1,
    id: "hint-test",
    difficulty: "easy",
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution,
    givens: solution.map((digit, index) => blankIndexes.includes(index) ? null : digit),
    strategies: [],
  };
}

describe("legacy smart hint flow", () => {
  it("prioritizes an incorrect answer and clears it only when applied", () => {
    const definition = puzzle([0]);
    const state = placeDigit(createGame(definition), definition, 0, 4);
    const hint = findSmartHint(state, definition);

    expect(hint?.strategy).toBe("incorrect-answer");
    expect(state.cells[0].value).toBe(4);
    const applied = applySmartHint(state, definition, hint!);
    expect(applied.cells[0].value).toBeNull();
  });

  it("offers Auto-Fill Notes before revealing a solving move", () => {
    const definition = puzzle([0, 1]);
    const state = createGame(definition);
    const hint = findSmartHint(state, definition);

    expect(hint?.strategy).toBe("auto-fill-notes");
    expect(hint?.copy["zh-Hant"].pages).toHaveLength(1);
    expect(state.cells[0].notes).toEqual([]);

    const applied = applySmartHint(state, definition, hint!);
    expect(applied.cells[0].notes).toEqual([5]);
    expect(applied.cells[1].notes).toEqual([]);
    expect(applied.cells[0].value).toBeNull();
  });

  it("uses the legacy batch threshold when at least three cells need notes", () => {
    const definition = puzzle([0, 1, 2]);
    const state = createGame(definition);
    const hint = findSmartHint(state, definition)!;
    const applied = applySmartHint(state, definition, hint);

    expect(hint.strategy).toBe("auto-fill-notes");
    expect(hint.edits).toHaveLength(3);
    expect(applied.cells[0].notes).toEqual([5]);
    expect(applied.cells[1].notes).toEqual([3]);
    expect(applied.cells[2].notes).toEqual([4]);
  });

  it("returns a logical fill after notes are complete", () => {
    const definition = puzzle([0]);
    const state = createGame(definition);
    const noteHint = findSmartHint(state, definition)!;
    const noted = applySmartHint(state, definition, noteHint);
    const solveHint = findSmartHint(noted, definition);

    expect(solveHint?.strategy).toBe("hidden-single");
    expect(solveHint?.edits[0].value).toBe(5);
  });

  it("does not restore a candidate removed by a solving strategy", () => {
    const definition = puzzle(Array.from({ length: 81 }, (_, index) => index));
    const initial = createGame(definition);
    const autoFill = findSmartHint(initial, definition)!;
    const noted = applySmartHint(initial, definition, autoFill);
    const afterPairElimination = applyGameEdits(noted, definition, [{
      index: 40,
      notes: noted.cells[40].notes.filter((note) => note !== 4),
    }]);

    expect(afterPairElimination.cells[40].notes).not.toContain(4);
    expect(afterPairElimination.cells[40].notes).toContain(solution[40]);
    expect(findSmartHint(afterPairElimination, definition)?.strategy).not.toBe("auto-fill-notes");
  });
});
