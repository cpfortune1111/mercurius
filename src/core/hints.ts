import { applyGameEdits, getCandidates, type GameEdit } from "./game";
import type { Digit, GameState, PuzzleDefinition } from "./types";

export type HintHighlight = "key" | "error" | "eliminate" | "auxiliary" | "cycle";
export type HintStrategy =
  | "incorrect-answer"
  | "auto-fill-notes"
  | "note-error"
  | "hidden-single"
  | "naked-pair"
  | "hidden-pair"
  | "intersection-removal"
  | "last-blank"
  | "last-remaining-cell";

export interface HintCellHighlight {
  readonly index: number;
  readonly type: HintHighlight;
}

export interface HintCopy {
  readonly title: string;
  readonly pages: readonly string[];
}

export interface SmartHint {
  readonly strategy: HintStrategy;
  readonly copy: Readonly<Record<"zh-Hant" | "en", HintCopy>>;
  readonly highlights: readonly HintCellHighlight[];
  readonly edits: readonly GameEdit[];
}

const digits: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
type Unit = { labelZh: string; labelEn: string; indexes: number[] };

function cellName(index: number): string {
  return `R${Math.floor(index / 9) + 1}C${index % 9 + 1}`;
}

function allUnits(): Unit[] {
  const rows = Array.from({ length: 9 }, (_, row) => ({
    labelZh: `第 ${row + 1} 行`, labelEn: `row ${row + 1}`,
    indexes: Array.from({ length: 9 }, (_, col) => row * 9 + col),
  }));
  const cols = Array.from({ length: 9 }, (_, col) => ({
    labelZh: `第 ${col + 1} 列`, labelEn: `column ${col + 1}`,
    indexes: Array.from({ length: 9 }, (_, row) => row * 9 + col),
  }));
  const boxes = Array.from({ length: 9 }, (_, box) => {
    const startRow = Math.floor(box / 3) * 3;
    const startCol = (box % 3) * 3;
    return {
      labelZh: `第 ${box + 1} 宮`, labelEn: `box ${box + 1}`,
      indexes: Array.from({ length: 9 }, (_, offset) =>
        (startRow + Math.floor(offset / 3)) * 9 + startCol + offset % 3),
    };
  });
  return [...rows, ...cols, ...boxes];
}

const units = allUnits();

function result(
  strategy: HintStrategy,
  titleZh: string,
  titleEn: string,
  pagesZh: readonly string[],
  pagesEn: readonly string[],
  highlights: readonly HintCellHighlight[],
  edits: readonly GameEdit[],
): SmartHint {
  return {
    strategy,
    copy: {
      "zh-Hant": { title: titleZh, pages: pagesZh },
      en: { title: titleEn, pages: pagesEn },
    },
    highlights,
    edits,
  };
}

function incorrectAnswer(state: GameState, puzzle: PuzzleDefinition): SmartHint | null {
  const index = state.cells.findIndex((cell, i) => !cell.given && cell.value !== null && cell.value !== puzzle.solution[i]);
  if (index < 0) return null;
  const value = state.cells[index].value;
  return result("incorrect-answer", "錯誤答案", "Incorrect Answer",
    [`${cellName(index)} 的數字 ${value} 與同行、同列或同宮產生衝突。清除佢之後再重新推理。`],
    [`Digit ${value} in ${cellName(index)} conflicts with its row, column, or box. Clear it and reason again.`],
    [{ index, type: "error" }], [{ index, value: null, notes: [] }]);
}

function autoFillNotes(state: GameState): SmartHint | null {
  const edits: GameEdit[] = [];
  for (let index = 0; index < 81; index += 1) {
    const cell = state.cells[index];
    if (cell.given || cell.value !== null) continue;
    const candidates = getCandidates(state, index);
    const notes = [...new Set([...cell.notes, ...candidates])].sort((a, b) => a - b) as Digit[];
    if (notes.length !== cell.notes.length) edits.push({ index, notes });
  }
  if (edits.length === 0) return null;
  const total = edits.reduce((sum, edit) => sum + (edit.notes!.length - state.cells[edit.index].notes.length), 0);
  const highlights = edits.map(({ index }) => ({ index, type: "auxiliary" as const }));
  return result("auto-fill-notes", "自動填入筆記", "Auto-Fill Notes",
    [`有 ${edits.length} 格欠缺有效候選數字，共可補上 ${total} 個筆記。`],
    [`${edits.length} cells are missing valid candidates, with ${total} notes to add.`],
    highlights, edits);
}

function noteError(state: GameState): SmartHint | null {
  for (let index = 0; index < 81; index += 1) {
    const cell = state.cells[index];
    if (cell.value !== null || cell.notes.length === 0) continue;
    const candidates = new Set(getCandidates(state, index));
    const invalid = cell.notes.find((note) => !candidates.has(note));
    if (invalid !== undefined) {
      return result("note-error", "筆記錯誤", "Note Error",
        [`${cellName(index)} 的筆記 ${invalid} 與同行、同列或同宮已有數字衝突。`],
        [`Note ${invalid} in ${cellName(index)} conflicts with a digit already in its row, column, or box.`],
        [{ index, type: "error" }], [{ index, notes: cell.notes.filter((note) => note !== invalid) }]);
    }
  }
  return null;
}

function hiddenSingle(state: GameState, puzzle: PuzzleDefinition): SmartHint | null {
  for (const unit of units) {
    for (const digit of digits) {
      if (unit.indexes.some((index) => state.cells[index].value === digit)) continue;
      const targets = unit.indexes.filter((index) => getCandidates(state, index).includes(digit));
      if (targets.length === 1) {
        const index = targets[0];
        return result("hidden-single", "隱性唯一數", "Hidden Single",
          [`喺${unit.labelZh}入面，只有 ${cellName(index)} 可以填入 ${digit}。`],
          [`In ${unit.labelEn}, only ${cellName(index)} can contain ${digit}.`],
          [{ index, type: "key" }], [{ index, value: puzzle.solution[index], notes: [] }]);
      }
    }
  }
  return null;
}

function pairHint(state: GameState, hidden: boolean): SmartHint | null {
  for (const unit of units) {
    if (!hidden) {
      const cells = unit.indexes.filter((i) => state.cells[i].value === null && state.cells[i].notes.length === 2);
      for (let a = 0; a < cells.length; a += 1) for (let b = a + 1; b < cells.length; b += 1) {
        const first = state.cells[cells[a]].notes;
        const second = state.cells[cells[b]].notes;
        if (first.join() !== second.join()) continue;
        const targets = unit.indexes.filter((i) => i !== cells[a] && i !== cells[b] && state.cells[i].value === null && state.cells[i].notes.some((n) => first.includes(n)));
        if (targets.length === 0) continue;
        const edits = targets.map((index) => ({ index, notes: state.cells[index].notes.filter((n) => !first.includes(n)) }));
        return result("naked-pair", "顯性數對", "Naked Pair",
          [`喺${unit.labelZh}，${cellName(cells[a])} 同 ${cellName(cells[b])} 只包含 ${first.join("、")}。`, `所以可以由紅色格刪除 ${first.join("、")} 筆記。`],
          [`In ${unit.labelEn}, ${cellName(cells[a])} and ${cellName(cells[b])} contain only ${first.join(" and ")}.`, `Remove ${first.join(" and ")} from the red cells.`],
          [{ index: cells[a], type: "key" }, { index: cells[b], type: "key" }, ...targets.map((index) => ({ index, type: "eliminate" as const }))], edits);
      }
    } else {
      for (let a = 1 as Digit; a <= 8; a = (a + 1) as Digit) for (let b = (a + 1) as Digit; b <= 9; b = (b + 1) as Digit) {
        const aCells = unit.indexes.filter((i) => state.cells[i].value === null && state.cells[i].notes.includes(a));
        const bCells = unit.indexes.filter((i) => state.cells[i].value === null && state.cells[i].notes.includes(b));
        if (aCells.length !== 2 || bCells.length !== 2 || aCells.join() !== bCells.join()) continue;
        const edits = aCells.map((index) => ({ index, notes: state.cells[index].notes.filter((n) => n === a || n === b) }));
        if (edits.every((edit) => edit.notes!.length === state.cells[edit.index].notes.length)) continue;
        return result("hidden-pair", "隱性數對", "Hidden Pair",
          [`喺${unit.labelZh}，${a} 同 ${b} 只可以出現喺 ${aCells.map(cellName).join("、")}。`, "保留呢一對數字，刪除兩格內其他紅色候選。"],
          [`In ${unit.labelEn}, ${a} and ${b} can appear only in ${aCells.map(cellName).join(" and ")}.`, "Keep the pair and remove every other candidate from those cells."],
          aCells.map((index) => ({ index, type: "eliminate" as const })), edits);
      }
    }
  }
  return null;
}

function intersectionRemoval(state: GameState): SmartHint | null {
  for (let box = 0; box < 9; box += 1) {
    const boxUnit = units[18 + box];
    for (const digit of digits) {
      const sources = boxUnit.indexes.filter((i) => state.cells[i].value === null && state.cells[i].notes.includes(digit));
      if (sources.length < 2) continue;
      const sameRow = sources.every((i) => Math.floor(i / 9) === Math.floor(sources[0] / 9));
      const sameCol = sources.every((i) => i % 9 === sources[0] % 9);
      const targets = sameRow
        ? units[Math.floor(sources[0] / 9)].indexes.filter((i) => !boxUnit.indexes.includes(i) && state.cells[i].notes.includes(digit))
        : sameCol
          ? units[9 + sources[0] % 9].indexes.filter((i) => !boxUnit.indexes.includes(i) && state.cells[i].notes.includes(digit))
          : [];
      if (targets.length === 0) continue;
      const lineZh = sameRow ? `第 ${Math.floor(sources[0] / 9) + 1} 行` : `第 ${sources[0] % 9 + 1} 列`;
      const lineEn = sameRow ? `row ${Math.floor(sources[0] / 9) + 1}` : `column ${sources[0] % 9 + 1}`;
      return result("intersection-removal", "區塊互鎖", "Intersection Removal",
        [`喺${boxUnit.labelZh}，候選數字 ${digit} 全部集中於${lineZh}。`, `因此可以由該${lineZh}其餘紅色格刪除 ${digit}。`],
        [`In ${boxUnit.labelEn}, every candidate ${digit} lies on ${lineEn}.`, `Remove ${digit} from the other red cells on that line.`],
        [...sources.map((index) => ({ index, type: "key" as const })), ...targets.map((index) => ({ index, type: "eliminate" as const }))],
        targets.map((index) => ({ index, notes: state.cells[index].notes.filter((n) => n !== digit) })));
    }
  }
  return null;
}

function lastBlank(state: GameState, puzzle: PuzzleDefinition): SmartHint | null {
  for (const unit of units) {
    const blanks = unit.indexes.filter((index) => state.cells[index].value === null);
    if (blanks.length !== 1) continue;
    const index = blanks[0];
    const digit = puzzle.solution[index];
    return result("last-blank", "最後空格", "Last Blank",
      [`${unit.labelZh}只剩 ${cellName(index)} 未填，答案係 ${digit}。`],
      [`Only ${cellName(index)} is blank in ${unit.labelEn}; fill it with ${digit}.`],
      [{ index, type: "key" }], [{ index, value: digit, notes: [] }]);
  }
  return null;
}

function lastRemainingCell(state: GameState, puzzle: PuzzleDefinition): SmartHint | null {
  for (let index = 0; index < 81; index += 1) {
    if (state.cells[index].value !== null) continue;
    const candidates = getCandidates(state, index);
    if (candidates.length !== 1) continue;
    return result("last-remaining-cell", "唯一候選", "Last Remaining Cell",
      [`${cellName(index)} 只剩一個候選數字 ${candidates[0]}。`],
      [`${cellName(index)} has only one candidate left: ${candidates[0]}.`],
      [{ index, type: "key" }], [{ index, value: puzzle.solution[index], notes: [] }]);
  }
  return null;
}

export function findSmartHint(state: GameState, puzzle: PuzzleDefinition): SmartHint | null {
  if (state.completed) return null;
  return incorrectAnswer(state, puzzle)
    ?? autoFillNotes(state)
    ?? noteError(state)
    ?? hiddenSingle(state, puzzle)
    ?? pairHint(state, false)
    ?? pairHint(state, true)
    ?? intersectionRemoval(state)
    ?? lastBlank(state, puzzle)
    ?? lastRemainingCell(state, puzzle);
}

export function applySmartHint(state: GameState, puzzle: PuzzleDefinition, hint: SmartHint): GameState {
  return applyGameEdits(state, puzzle, hint.edits);
}
