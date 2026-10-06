import { describe, expect, it } from "vitest";
import {
  createGame,
  eraseCell,
  getCandidates,
  isComplete,
  placeDigit,
  toggleNote,
  undo,
} from "../src/core/game";
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

function puzzleWithGivens(givenIndexes: number[] = []): PuzzleDefinition {
  const givens = solution.map((digit, index) => (givenIndexes.includes(index) ? digit : null));
  return {
    schemaVersion: 1,
    id: "test-puzzle",
    difficulty: "easy",
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution,
    givens,
    strategies: [],
  };
}

describe("game state", () => {
  it("protects given cells", () => {
    const puzzle = puzzleWithGivens([0]);
    const initial = createGame(puzzle);

    expect(placeDigit(initial, puzzle, 0, 4)).toBe(initial);
    expect(eraseCell(initial, 0)).toBe(initial);
    expect(toggleNote(initial, 0, 4)).toBe(initial);
  });

  it("removes matching notes from row, column, and box peers", () => {
    const puzzle = puzzleWithGivens();
    let state = createGame(puzzle);
    state = toggleNote(state, 1, 5);
    state = toggleNote(state, 9, 5);
    state = toggleNote(state, 10, 5);
    state = toggleNote(state, 40, 5);

    state = placeDigit(state, puzzle, 0, 5);

    expect(state.cells[0].value).toBe(5);
    expect(state.cells[1].notes).not.toContain(5);
    expect(state.cells[9].notes).not.toContain(5);
    expect(state.cells[10].notes).not.toContain(5);
    expect(state.cells[40].notes).toContain(5);
  });

  it("allows unlimited mistakes while recording them", () => {
    const puzzle = puzzleWithGivens();
    let state = createGame(puzzle);

    state = placeDigit(state, puzzle, 0, 1);
    state = placeDigit(state, puzzle, 1, 1);
    state = placeDigit(state, puzzle, 2, 1);
    state = placeDigit(state, puzzle, 3, 1);

    expect(state.mistakes).toBe(4);
    expect(state.completed).toBe(false);
  });

  it("undo restores a placement and all notes removed by that placement", () => {
    const puzzle = puzzleWithGivens();
    let state = createGame(puzzle);
    state = toggleNote(state, 1, 5);
    const beforePlacement = state;
    state = placeDigit(state, puzzle, 0, 5);
    state = undo(state);

    expect(state.cells).toEqual(beforePlacement.cells);
    expect(state.mistakes).toBe(beforePlacement.mistakes);
  });

  it("calculates legal candidates from current peer values", () => {
    const puzzle = puzzleWithGivens([0, 1, 9]);
    const state = createGame(puzzle);

    expect(getCandidates(state, 10)).not.toContain(5);
    expect(getCandidates(state, 10)).not.toContain(3);
    expect(getCandidates(state, 10)).not.toContain(6);
  });

  it("detects a completed solution", () => {
    const puzzle = puzzleWithGivens();
    let state = createGame(puzzle);

    solution.forEach((digit, index) => {
      state = placeDigit(state, puzzle, index, digit);
    });

    expect(state.completed).toBe(true);
    expect(isComplete(state, puzzle)).toBe(true);
  });
});
