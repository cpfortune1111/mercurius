import type { LegacyPuzzleDefinition } from "../../src/core/types";

function tokens(value: string): string[] {
  return value.split(",");
}

export const legacyPuzzles: readonly LegacyPuzzleDefinition[] = [
  {
    id: "puzzle_863444034",
    groupId: "easy",
    shiftAmount: 0,
    seed: 863444034,
    strategies: ["Hidden Single"],
    boardData: tokens("4,7,0,t8,3,t5,1,6,t2,3,t2,t8,t6,t1,7,t4,t5,0,t5,1,t6,t2,4,t0,8,7,3,1,t3,7,0,t8,6,2,4,5,0,t6,2,t7,5,t4,3,t8,t1,8,4,5,3,t2,1,7,0,6,7,t8,t1,5,6,3,0,2,t4,6,t0,3,t4,t7,2,5,t1,8,2,5,t4,1,0,t8,t6,t3,7"),
  },
  {
    id: "puzzle_1893833119",
    groupId: "medium",
    shiftAmount: 0,
    seed: 1893833119,
    strategies: ["Hidden Single", "Naked Pair"],
    boardData: tokens("t7,5,t4,8,1,t0,3,6,2,3,6,0,4,t2,5,7,t8,1,8,1,2,3,6,t7,0,t5,4,0,t8,t5,t1,t7,t2,t4,3,t6,6,t2,3,0,5,4,8,1,t7,t4,t7,t1,6,t8,t3,5,2,0,1,4,6,7,t3,t8,2,0,t5,2,3,7,t5,0,1,t6,4,8,5,0,8,t2,t4,t6,t1,t7,3"),
  },
  {
    id: "puzzle_593143360",
    groupId: "hard",
    shiftAmount: 0,
    seed: 593143360,
    strategies: ["Hidden Single", "Naked Pair"],
    boardData: tokens("0,5,t6,4,t8,t3,t7,t2,t1,3,7,4,2,t5,t1,8,6,0,t8,t2,t1,7,t6,t0,t3,5,4,5,6,t8,3,4,t7,t1,0,2,2,4,0,t6,t1,8,5,7,3,7,1,t3,t5,0,2,4,t8,t6,4,3,t5,0,7,6,t2,1,t8,t6,8,7,1,2,4,0,3,5,1,0,t2,t8,3,5,6,t4,7"),
  },
  {
    id: "puzzle_1173359496",
    groupId: "expert",
    shiftAmount: 0,
    seed: 1173359496,
    strategies: ["Hidden Single", "Pointing", "X-Wing", "XY-Wing"],
    boardData: tokens("t1,0,7,4,3,t8,6,t2,5,4,2,6,t7,0,5,t8,t3,1,t5,8,3,t6,1,t2,4,0,t7,2,5,t8,3,t4,t7,1,t6,t0,7,t6,1,8,2,t0,5,4,3,0,t3,4,5,6,1,t7,t8,2,3,t7,t0,1,8,t6,2,5,4,6,t4,5,2,7,t3,t0,t1,8,8,1,2,0,5,4,t3,7,t6"),
  },
];
