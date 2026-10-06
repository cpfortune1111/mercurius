import { describe, expect, it } from "vitest";
import { convertLegacyPuzzle } from "../src/core/legacy";
import { legacyPuzzles } from "./fixtures/legacy-puzzles";

describe("legacy puzzle conversion", () => {
  it("converts one reference puzzle from every original difficulty", () => {
    const converted = legacyPuzzles.map(convertLegacyPuzzle);

    expect(converted.map((puzzle) => puzzle.difficulty)).toEqual([
      "easy",
      "medium",
      "hard",
      "expert",
    ]);
    expect(converted.every((puzzle) => puzzle.solution.length === 81)).toBe(true);
    expect(converted.every((puzzle) => puzzle.givens.length === 81)).toBe(true);
  });

  it("preserves Unity token and shift semantics", () => {
    const puzzle = convertLegacyPuzzle(legacyPuzzles[0]);

    expect(puzzle.solution[0]).toBe(5);
    expect(puzzle.givens[0]).toBeNull();
    expect(puzzle.solution[3]).toBe(9);
    expect(puzzle.givens[3]).toBe(9);
  });

  it("rejects malformed legacy data", () => {
    expect(() =>
      convertLegacyPuzzle({
        ...legacyPuzzles[0],
        boardData: ["t0"],
      }),
    ).toThrow(/81 cells/);
  });
});
