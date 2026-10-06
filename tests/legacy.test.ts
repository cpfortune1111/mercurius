import { describe, expect, it } from "vitest";
import { convertLegacyPuzzle } from "../src/core/legacy";
import { legacyReferencePuzzles } from "../src/content/reference-puzzles";

describe("legacy puzzle conversion", () => {
  it("converts one reference puzzle from every original difficulty", () => {
    const converted = legacyReferencePuzzles.map(convertLegacyPuzzle);

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
    const puzzle = convertLegacyPuzzle(legacyReferencePuzzles[0]);

    expect(puzzle.solution[0]).toBe(5);
    expect(puzzle.givens[0]).toBeNull();
    expect(puzzle.solution[3]).toBe(9);
    expect(puzzle.givens[3]).toBe(9);
  });

  it("rejects malformed legacy data", () => {
    expect(() =>
      convertLegacyPuzzle({
        ...legacyReferencePuzzles[0],
        boardData: ["t0"],
      }),
    ).toThrow(/81 cells/);
  });
});
