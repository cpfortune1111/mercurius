import type { Digit, LegacyPuzzleDefinition, PuzzleDefinition } from "./types";

function asDigit(value: number, context: string): Digit {
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    throw new Error(`${context} must resolve to a digit from 1 to 9`);
  }

  return value as Digit;
}

export function convertLegacyPuzzle(legacy: LegacyPuzzleDefinition): PuzzleDefinition {
  if (legacy.boardData.length !== 81) {
    throw new Error(`Legacy puzzle ${legacy.id} must contain exactly 81 cells`);
  }

  const solution: Digit[] = [];
  const givens: (Digit | null)[] = [];

  legacy.boardData.forEach((token, index) => {
    const given = token.startsWith("t");
    const rawText = given ? token.slice(1) : token;
    const raw = Number(rawText);

    if (!Number.isInteger(raw) || raw < 0 || raw > 8) {
      throw new Error(`Legacy puzzle ${legacy.id} has an invalid token at cell ${index}`);
    }

    const displayValue = 1 + ((raw + legacy.shiftAmount) % 9);
    const digit = asDigit(displayValue, `Legacy puzzle ${legacy.id} cell ${index}`);
    solution.push(digit);
    givens.push(given ? digit : null);
  });

  return {
    schemaVersion: 1,
    id: legacy.id,
    difficulty: legacy.groupId,
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution,
    givens,
    strategies: legacy.strategies ?? [],
    legacySeed: legacy.seed,
  };
}
