import type { Digit, GameState } from "./types";
import type { HintCellHighlight, HintStrategy, SmartHint } from "./hints";

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
type Unit = { zh: string; en: string; cells: number[] };

const units: Unit[] = [
  ...Array.from({ length: 9 }, (_, r) => ({ zh: `第 ${r + 1} 行`, en: `row ${r + 1}`, cells: Array.from({ length: 9 }, (_, c) => r * 9 + c) })),
  ...Array.from({ length: 9 }, (_, c) => ({ zh: `第 ${c + 1} 列`, en: `column ${c + 1}`, cells: Array.from({ length: 9 }, (_, r) => r * 9 + c) })),
  ...Array.from({ length: 9 }, (_, b) => ({ zh: `第 ${b + 1} 宮`, en: `box ${b + 1}`, cells: Array.from({ length: 9 }, (_, p) => (Math.floor(b / 3) * 3 + Math.floor(p / 3)) * 9 + (b % 3) * 3 + p % 3) })),
];

function name(index: number): string { return `R${Math.floor(index / 9) + 1}C${index % 9 + 1}`; }
function row(index: number): number { return Math.floor(index / 9); }
function col(index: number): number { return index % 9; }
function box(index: number): number { return Math.floor(row(index) / 3) * 3 + Math.floor(col(index) / 3); }
function sees(a: number, b: number): boolean { return a !== b && (row(a) === row(b) || col(a) === col(b) || box(a) === box(b)); }
function notes(state: GameState, index: number): readonly Digit[] { return state.cells[index].value === null ? state.cells[index].notes : []; }

function combinations<T>(items: readonly T[], size: number): T[][] {
  const output: T[][] = [];
  const visit = (start: number, chosen: T[]) => {
    if (chosen.length === size) { output.push(chosen); return; }
    for (let i = start; i <= items.length - (size - chosen.length); i += 1) visit(i + 1, [...chosen, items[i]]);
  };
  visit(0, []);
  return output;
}

function make(
  strategy: HintStrategy, titleZh: string, titleEn: string,
  pagesZh: string[], pagesEn: string[], highlights: HintCellHighlight[],
  edits: { index: number; notes: readonly Digit[] }[],
): SmartHint {
  return { strategy, copy: { "zh-Hant": { title: titleZh, pages: pagesZh }, en: { title: titleEn, pages: pagesEn } }, highlights, edits };
}

export function findNakedSubsetHint(state: GameState, size: 3 | 4): SmartHint | null {
  for (const unit of units) {
    const eligible = unit.cells.filter((i) => notes(state, i).length >= 2 && notes(state, i).length <= size);
    for (const selected of combinations(eligible, size)) {
      const subset = [...new Set(selected.flatMap((i) => notes(state, i)))].sort() as Digit[];
      if (subset.length !== size) continue;
      const targets = unit.cells.filter((i) => !selected.includes(i) && notes(state, i).some((n) => subset.includes(n)));
      if (targets.length === 0) continue;
      const label = size === 3 ? ["顯性三數組", "Naked Triplet", "naked-triplet"] as const : ["顯性四數組", "Naked Quad", "naked-quad"] as const;
      const cellList = selected.map(name).join("、");
      const digitList = subset.join("、");
      return make(label[2], label[0], label[1],
        [`喺${unit.zh}，${cellList} 嘅候選數字只由 ${digitList} 組成。`, `所以可以喺紅色格刪除 ${digitList}。`],
        [`In ${unit.en}, ${cellList} contains only ${subset.join(", ")}.`, `Remove ${subset.join(", ")} from the red cells.`],
        [...selected.map((index) => ({ index, type: "key" as const })), ...targets.map((index) => ({ index, type: "eliminate" as const }))],
        targets.map((index) => ({ index, notes: notes(state, index).filter((n) => !subset.includes(n)) })));
    }
  }
  return null;
}

export function findHiddenSubsetHint(state: GameState, size: 3 | 4): SmartHint | null {
  for (const unit of units) {
    const unfilledDigits = digits.filter((digit) => !unit.cells.some((i) => state.cells[i].value === digit));
    for (const subset of combinations(unfilledDigits, size)) {
      const appearances = subset.map((digit) => unit.cells.filter((i) => notes(state, i).includes(digit)));
      if (appearances.some((cells) => cells.length < 2 || cells.length > size)) continue;
      const selected = [...new Set(appearances.flat())];
      if (selected.length !== size) continue;
      const edits = selected
        .filter((i) => notes(state, i).some((n) => !subset.includes(n)))
        .map((index) => ({ index, notes: notes(state, index).filter((n) => subset.includes(n)) }));
      if (edits.length === 0) continue;
      const label = size === 3 ? ["隱性三數組", "Hidden Triplet", "hidden-triplet"] as const : ["隱性四數組", "Hidden Quad", "hidden-quad"] as const;
      return make(label[2], label[0], label[1],
        [`喺${unit.zh}，${subset.join("、")} 只會出現喺 ${selected.map(name).join("、")}。`, "保留呢組數字，刪除以上格內其他候選。"],
        [`In ${unit.en}, ${subset.join(", ")} appear only in ${selected.map(name).join(", ")}.`, "Keep this set and remove every other candidate from those cells."],
        selected.map((index) => ({ index, type: edits.some((e) => e.index === index) ? "eliminate" as const : "auxiliary" as const })), edits);
    }
  }
  return null;
}

function candidateIndexes(state: GameState, digit: Digit): number[] {
  return state.cells.flatMap((cell, index) => cell.value === null && cell.notes.includes(digit) ? [index] : []);
}

export function findFishHint(state: GameState, size: 2 | 3 | 4): SmartHint | null {
  const meta = size === 2 ? ["X-Wing", "X-Wing", "x-wing"] as const
    : size === 3 ? ["劍魚", "Swordfish", "swordfish"] as const
      : ["水母", "Jellyfish", "jellyfish"] as const;
  for (const digit of digits) {
    const candidates = candidateIndexes(state, digit);
    for (const byRows of [true, false]) {
      const bases = Array.from({ length: 9 }, (_, base) => {
        const covers = [...new Set(candidates.filter((i) => (byRows ? row(i) : col(i)) === base).map((i) => byRows ? col(i) : row(i)))];
        return { base, covers };
      }).filter(({ covers }) => covers.length >= 2 && covers.length <= size);
      for (const chosen of combinations(bases, size)) {
        const covers = [...new Set(chosen.flatMap((item) => item.covers))];
        if (covers.length !== size) continue;
        const baseSet = new Set(chosen.map((item) => item.base));
        const pattern = candidates.filter((i) => baseSet.has(byRows ? row(i) : col(i)) && covers.includes(byRows ? col(i) : row(i)));
        const targets = candidates.filter((i) => !baseSet.has(byRows ? row(i) : col(i)) && covers.includes(byRows ? col(i) : row(i)));
        if (targets.length === 0) continue;
        const baseText = chosen.map((item) => item.base + 1).join("、");
        const coverText = covers.map((value) => value + 1).join("、");
        const pagesZh = size === 2
          ? [`候選數字 ${digit} 喺${byRows ? "行" : "列"} ${baseText} 只落於${byRows ? "列" : "行"} ${coverText}。`, `可以由紅色格刪除候選數字 ${digit}。`]
          : [`基底${byRows ? "行" : "列"}：${baseText}。`, `覆蓋${byRows ? "列" : "行"}：${coverText}。`, `可以由紅色格刪除候選數字 ${digit}。`];
        const pagesEn = size === 2
          ? [`Candidate ${digit} in base ${byRows ? "rows" : "columns"} ${baseText} is confined to ${byRows ? "columns" : "rows"} ${coverText}.`, `Remove ${digit} from the red cells.`]
          : [`Base ${byRows ? "rows" : "columns"}: ${baseText}.`, `Cover ${byRows ? "columns" : "rows"}: ${coverText}.`, `Remove candidate ${digit} from the red cells.`];
        return make(meta[2], meta[0], meta[1], pagesZh, pagesEn,
          [...pattern.map((index) => ({ index, type: "key" as const })), ...targets.map((index) => ({ index, type: "eliminate" as const }))],
          targets.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== digit) })));
      }
    }
  }
  return null;
}

function strongGraph(state: GameState, digit: Digit): Map<number, Set<number>> {
  const candidates = new Set(candidateIndexes(state, digit));
  const graph = new Map<number, Set<number>>([...candidates].map((i) => [i, new Set<number>()]));
  for (const unit of units) {
    const found = unit.cells.filter((i) => candidates.has(i));
    if (found.length === 2) { graph.get(found[0])!.add(found[1]); graph.get(found[1])!.add(found[0]); }
  }
  return graph;
}

function colorComponents(graph: Map<number, Set<number>>): Map<number, 1 | -1>[] {
  const visited = new Set<number>(); const output: Map<number, 1 | -1>[] = [];
  for (const start of graph.keys()) {
    if (visited.has(start) || graph.get(start)!.size === 0) continue;
    const colors = new Map<number, 1 | -1>([[start, 1]]); const queue = [start]; visited.add(start);
    while (queue.length) {
      const current = queue.shift()!; const nextColor = colors.get(current) === 1 ? -1 : 1;
      for (const next of graph.get(current)!) if (!colors.has(next)) { colors.set(next, nextColor); visited.add(next); queue.push(next); }
    }
    if (colors.size >= 2) output.push(colors);
  }
  return output;
}

export function findColorHint(state: GameState, wrap: boolean): SmartHint | null {
  for (const digit of digits) {
    const candidates = candidateIndexes(state, digit);
    const components = colorComponents(strongGraph(state, digit));
    const componentsToCheck = wrap
      ? components
      : [...components].sort((a, b) => b.size - a.size).slice(0, 1);
    for (const colors of componentsToCheck) {
      const blue = [...colors].filter(([, color]) => color === 1).map(([i]) => i);
      const red = [...colors].filter(([, color]) => color === -1).map(([i]) => i);
      const blueConflict = blue.some((a, i) => blue.slice(i + 1).some((b) => sees(a, b)));
      const redConflict = red.some((a, i) => red.slice(i + 1).some((b) => sees(a, b)));
      if (wrap) {
        if (!blueConflict && !redConflict) continue;
        const falseChain = blueConflict ? blue : red;
        const trueChain = new Set(blueConflict ? red : blue);
        const eliminations = new Set(falseChain);
        const forced = new Set<number>();
        const collectEliminations = (source: number) => {
          for (const candidate of candidates) if (!trueChain.has(candidate) && sees(source, candidate)) eliminations.add(candidate);
        };
        [...trueChain].forEach(collectEliminations);
        let changed = true;
        while (changed) {
          changed = false;
          for (const unit of units) {
            const remaining = unit.cells.filter((i) => candidates.includes(i) && !eliminations.has(i) && !trueChain.has(i));
            if (remaining.length === 1) {
              const cell = remaining[0]; trueChain.add(cell); forced.add(cell); collectEliminations(cell); changed = true;
            }
          }
        }
        for (const forcedCell of forced) for (const trueCell of [...trueChain]) {
          if (forced.has(trueCell) || forcedCell === trueCell || !sees(forcedCell, trueCell)) continue;
          trueChain.delete(trueCell); eliminations.add(trueCell);
        }
        const graph = strongGraph(state, digit);
        const queue = [...trueChain];
        while (queue.length) for (const linked of graph.get(queue.shift()!) ?? []) {
          if (!trueChain.has(linked) && !eliminations.has(linked)) { trueChain.add(linked); queue.push(linked); }
        }
        for (const cell of trueChain) eliminations.delete(cell);
        const eliminationCells = [...eliminations];
        if (eliminationCells.length === 0) continue;
        return make("color-wrap", "Color Wrap", "Color Wrap",
          [`候選數字 ${digit} 嘅同色鏈喺同一單位產生衝突。`, `衝突顏色必定為假，刪除紅色格內嘅 ${digit}。`],
          [`One color for candidate ${digit} contradicts itself in a unit.`, `That color is false; remove ${digit} from the red cells.`],
          [...[...trueChain].map((index) => ({ index, type: "auxiliary" as const })), ...eliminationCells.map((index) => ({ index, type: "eliminate" as const }))],
          eliminationCells.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== digit) })));
      }
      if (blueConflict || redConflict) continue;
      const outside = candidates.filter((i) => !colors.has(i));
      const targets = outside.filter((i) => blue.some((b) => sees(i, b)) && red.some((r) => sees(i, r)));
      if (targets.length === 0) continue;
      return make("simple-coloring", "Color Trap", "Color Trap",
        [`候選數字 ${digit} 形成兩色強鏈。`, `紅色目標格同時睇到兩種顏色，所以可以刪除 ${digit}。`],
        [`Candidate ${digit} forms two alternating color chains.`, `The red targets see both colors, so ${digit} can be removed.`],
        [...blue.map((index) => ({ index, type: "key" as const })), ...red.map((index) => ({ index, type: "auxiliary" as const })), ...targets.map((index) => ({ index, type: "eliminate" as const }))],
        targets.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== digit) })));
    }
  }
  return null;
}

type Edge = { to: number; strong: boolean };
export function findXCycleHint(state: GameState): SmartHint | null {
  for (const digit of digits) {
    const candidates = candidateIndexes(state, digit); if (candidates.length < 4) continue;
    const strong = strongGraph(state, digit);
    const graph = new Map<number, Edge[]>(candidates.map((i) => [i, []]));
    for (let a = 0; a < candidates.length; a += 1) for (let b = a + 1; b < candidates.length; b += 1) {
      const first = candidates[a], second = candidates[b]; if (!sees(first, second)) continue;
      const isStrong = strong.get(first)?.has(second) ?? false;
      graph.get(first)!.push({ to: second, strong: isStrong }); graph.get(second)!.push({ to: first, strong: isStrong });
    }
    const search = (start: number, current: number, path: number[], expectStrong: boolean): number[] | null => {
      if (path.length >= 4 && path.length % 2 === 0 && graph.get(current)!.some((e) => e.to === start && e.strong === expectStrong)) return path;
      if (path.length >= 12) return null;
      for (const edge of graph.get(current)!) if (edge.strong === expectStrong && edge.to !== start && !path.includes(edge.to)) {
        const found = search(start, edge.to, [...path, edge.to], !expectStrong); if (found) return found;
      }
      return null;
    };
    for (const start of candidates) for (const firstStrong of [true, false]) {
      const cycle = search(start, start, [start], firstStrong); if (!cycle) continue;
      const a = cycle.filter((_, i) => i % 2 === 0), b = cycle.filter((_, i) => i % 2 === 1);
      const targets = candidates.filter((i) => !cycle.includes(i) && a.some((x) => sees(i, x)) && b.some((x) => sees(i, x)));
      if (targets.length === 0) continue;
      return make("x-cycle", "X-Cycle", "X-Cycle",
        [`候選數字 ${digit} 形成強弱交替循環。`, `紅色格同時睇到循環兩邊，可以刪除 ${digit}。`],
        [`Candidate ${digit} forms an alternating strong/weak cycle.`, `The red cells see both sides of the cycle, so remove ${digit}.`],
        [...a.map((index) => ({ index, type: "cycle" as const })), ...b.map((index) => ({ index, type: "auxiliary" as const })), ...targets.map((index) => ({ index, type: "eliminate" as const }))],
        targets.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== digit) })));
    }
  }
  return null;
}

export function findWingHint(state: GameState, xyz: boolean): SmartHint | null {
  const bivalue = state.cells.flatMap((cell, index) => cell.value === null && cell.notes.length === 2 ? [{ index, notes: cell.notes }] : []);
  if (!xyz) {
    for (const pivot of bivalue) for (const wingA of bivalue) for (const wingB of bivalue) {
      if (pivot === wingA || pivot === wingB || wingA === wingB || !sees(pivot.index, wingA.index) || !sees(pivot.index, wingB.index)) continue;
      const sharedA = pivot.notes.filter((n) => wingA.notes.includes(n)); const sharedB = pivot.notes.filter((n) => wingB.notes.includes(n));
      if (sharedA.length !== 1 || sharedB.length !== 1 || sharedA[0] === sharedB[0]) continue;
      const z = wingA.notes.find((n) => !pivot.notes.includes(n));
      if (!z || !wingB.notes.includes(z)) continue;
      const targets = candidateIndexes(state, z).filter((i) => i !== pivot.index && i !== wingA.index && i !== wingB.index && sees(i, wingA.index) && sees(i, wingB.index));
      if (targets.length === 0) continue;
      return make("xy-wing", "XY-Wing", "XY-Wing",
        [`${name(pivot.index)} 係樞紐，${name(wingA.index)} 同 ${name(wingB.index)} 形成兩翼。`, `兩翼共同候選 ${z} 可以由紅色交集格刪除。`],
        [`${name(pivot.index)} is the pivot; ${name(wingA.index)} and ${name(wingB.index)} are the pincers.`, `Remove their shared candidate ${z} from the red intersection cells.`],
        [{ index: pivot.index, type: "key" }, { index: wingA.index, type: "auxiliary" }, { index: wingB.index, type: "auxiliary" }, ...targets.map((index) => ({ index, type: "eliminate" as const }))],
        targets.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== z) })));
    }
    return null;
  }
  const trivalue = state.cells.flatMap((cell, index) => cell.value === null && cell.notes.length === 3 ? [{ index, notes: cell.notes }] : []);
  for (const pivot of trivalue) for (const [wingA, wingB] of combinations(bivalue, 2)) {
    if (!sees(pivot.index, wingA.index) || !sees(pivot.index, wingB.index)) continue;
    if (![...wingA.notes, ...wingB.notes].every((n) => pivot.notes.includes(n))) continue;
    const common = wingA.notes.filter((n) => wingB.notes.includes(n));
    if (common.length !== 1 || new Set([...wingA.notes, ...wingB.notes]).size !== 3) continue;
    const z = common[0];
    const targets = candidateIndexes(state, z).filter((i) => ![pivot.index, wingA.index, wingB.index].includes(i) && sees(i, pivot.index) && sees(i, wingA.index) && sees(i, wingB.index));
    if (targets.length === 0) continue;
    return make("xyz-wing", "XYZ-Wing", "XYZ-Wing",
      [`${name(pivot.index)} 係三候選樞紐，兩翼位於 ${name(wingA.index)}、${name(wingB.index)}。`, `三格共同限制候選 ${z}，可以由紅色交集格刪除。`],
      [`${name(pivot.index)} is the three-candidate pivot, with wings at ${name(wingA.index)} and ${name(wingB.index)}.`, `Remove common candidate ${z} from cells that see all three.`],
      [{ index: pivot.index, type: "key" }, { index: wingA.index, type: "auxiliary" }, { index: wingB.index, type: "auxiliary" }, ...targets.map((index) => ({ index, type: "eliminate" as const }))],
      targets.map((index) => ({ index, notes: notes(state, index).filter((n) => n !== z) })));
  }
  return null;
}
