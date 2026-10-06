export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface PuzzleDefinition {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly difficulty: Difficulty;
  readonly size: 9;
  readonly boxRows: 3;
  readonly boxCols: 3;
  readonly solution: readonly Digit[];
  readonly givens: readonly (Digit | null)[];
  readonly strategies: readonly string[];
  readonly legacySeed?: number;
}

export interface LegacyPuzzleDefinition {
  readonly id: string;
  readonly groupId: Difficulty;
  readonly shiftAmount: number;
  readonly boardData: readonly string[];
  readonly strategies?: readonly string[];
  readonly seed?: number;
}

export interface GameCell {
  readonly given: boolean;
  readonly value: Digit | null;
  readonly notes: readonly Digit[];
}

export interface GameSnapshot {
  readonly cells: readonly GameCell[];
  readonly mistakes: number;
  readonly completed: boolean;
}

export interface GameState extends GameSnapshot {
  readonly schemaVersion: 1;
  readonly puzzleId: string;
  readonly history: readonly GameSnapshot[];
}
