import type { Digit, GameCell, GameSnapshot, GameState, PuzzleDefinition } from "./types";

const BOARD_SIZE = 9;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
const ALL_DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function assertCellIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
    throw new RangeError(`Cell index ${index} is outside the board`);
  }
}

function copyCell(cell: GameCell): GameCell {
  return { ...cell, notes: [...cell.notes] };
}

function snapshot(state: GameState): GameSnapshot {
  return {
    cells: state.cells.map(copyCell),
    mistakes: state.mistakes,
    completed: state.completed,
  };
}

function withHistory(state: GameState, cells: readonly GameCell[], mistakes = state.mistakes): GameState {
  return {
    ...state,
    cells,
    mistakes,
    completed: false,
    history: [...state.history, snapshot(state)],
  };
}

export function arePeers(first: number, second: number): boolean {
  assertCellIndex(first);
  assertCellIndex(second);

  if (first === second) return false;

  const firstRow = Math.floor(first / BOARD_SIZE);
  const firstCol = first % BOARD_SIZE;
  const secondRow = Math.floor(second / BOARD_SIZE);
  const secondCol = second % BOARD_SIZE;

  return (
    firstRow === secondRow ||
    firstCol === secondCol ||
    (Math.floor(firstRow / 3) === Math.floor(secondRow / 3) &&
      Math.floor(firstCol / 3) === Math.floor(secondCol / 3))
  );
}

export function createGame(puzzle: PuzzleDefinition): GameState {
  if (puzzle.solution.length !== CELL_COUNT || puzzle.givens.length !== CELL_COUNT) {
    throw new Error(`Puzzle ${puzzle.id} must contain exactly 81 solution cells and givens`);
  }

  const cells = puzzle.givens.map<GameCell>((given) => ({
    given: given !== null,
    value: given,
    notes: [],
  }));

  return {
    schemaVersion: 1,
    puzzleId: puzzle.id,
    cells,
    mistakes: 0,
    completed: false,
    history: [],
  };
}

export function getCandidates(state: GameState, index: number): readonly Digit[] {
  assertCellIndex(index);
  const cell = state.cells[index];
  if (cell.given || cell.value !== null) return [];

  const used = new Set<Digit>();
  state.cells.forEach((peer, peerIndex) => {
    if (arePeers(index, peerIndex) && peer.value !== null) used.add(peer.value);
  });

  return ALL_DIGITS.filter((digit) => !used.has(digit));
}

export function toggleNote(state: GameState, index: number, digit: Digit): GameState {
  assertCellIndex(index);
  const target = state.cells[index];
  if (target.given || target.value !== null || state.completed) return state;

  const hasNote = target.notes.includes(digit);
  const notes = hasNote
    ? target.notes.filter((note) => note !== digit)
    : [...target.notes, digit].sort((left, right) => left - right);
  const cells = state.cells.map((cell, cellIndex) =>
    cellIndex === index ? { ...copyCell(cell), notes } : copyCell(cell),
  );

  return withHistory(state, cells);
}

export function placeDigit(
  state: GameState,
  puzzle: PuzzleDefinition,
  index: number,
  digit: Digit,
): GameState {
  assertCellIndex(index);
  const target = state.cells[index];
  if (target.given || state.completed || target.value === digit) return state;

  const cells = state.cells.map((cell, cellIndex): GameCell => {
    if (cellIndex === index) {
      return { ...copyCell(cell), value: digit, notes: [] };
    }

    if (arePeers(index, cellIndex) && cell.notes.includes(digit)) {
      return { ...copyCell(cell), notes: cell.notes.filter((note) => note !== digit) };
    }

    return copyCell(cell);
  });

  const mistakes = state.mistakes + (puzzle.solution[index] === digit ? 0 : 1);
  const next = withHistory(state, cells, mistakes);
  return { ...next, completed: isComplete(next, puzzle) };
}

export function eraseCell(state: GameState, index: number): GameState {
  assertCellIndex(index);
  const target = state.cells[index];
  if (target.given || state.completed || (target.value === null && target.notes.length === 0)) {
    return state;
  }

  const cells = state.cells.map((cell, cellIndex) =>
    cellIndex === index ? { ...copyCell(cell), value: null, notes: [] } : copyCell(cell),
  );
  return withHistory(state, cells);
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous) return state;

  return {
    ...state,
    cells: previous.cells.map(copyCell),
    mistakes: previous.mistakes,
    completed: previous.completed,
    history: state.history.slice(0, -1),
  };
}

export function isComplete(state: GameState, puzzle: PuzzleDefinition): boolean {
  return state.cells.every((cell, index) => cell.value === puzzle.solution[index]);
}
