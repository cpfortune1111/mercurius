import { useEffect, useMemo, useState } from "react";
import { HINT_COST, INITIAL_HINTS, REWARDED_AD_HINTS } from "./application/rules";
import { referencePuzzles } from "./content/reference-puzzles";
import { createGame, eraseCell, placeDigit, toggleNote, undo } from "./core/game";
import type { Difficulty, Digit, GameState } from "./core/types";

type Locale = "zh-Hant" | "en";
type Screen = "home" | "difficulty" | "game" | "records";
type Theme = "mercury" | "aurora" | "dawn" | "graphite";

interface SavedGame {
  difficulty: Difficulty;
  state: GameState;
  elapsed: number;
  hintsUsed: number;
}

interface Records {
  completed: number;
  best: Partial<Record<Difficulty, number>>;
}

const digits: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const difficulties: readonly Difficulty[] = ["easy", "medium", "hard", "expert"];
const themes: readonly Theme[] = ["mercury", "aurora", "dawn", "graphite"];
const storage = {
  game: "mercurius.active-game.v1",
  hints: "mercurius.hints.v1",
  records: "mercurius.records.v1",
  theme: "mercurius.theme.v1",
} as const;

const copy = {
  "zh-Hant": {
    tagline: "在星軌之間，尋找唯一答案。",
    newGame: "新遊戲",
    newGameSub: "選擇難度，開始解題",
    continue: "繼續遊戲",
    continueSub: "回到未完成的棋局",
    records: "個人紀錄",
    recordsSub: "查看完成數與最佳時間",
    daily: "每日挑戰",
    missions: "今日任務",
    phase2: "第二階段",
    selectDifficulty: "選擇難度",
    selectSub: "四個難度，沿用原版解題邏輯",
    easy: "簡單",
    medium: "中等",
    hard: "困難",
    expert: "專家",
    easyDesc: "輕鬆熱身",
    mediumDesc: "需要多一步觀察",
    hardDesc: "為熟練玩家而設",
    expertDesc: "完整策略挑戰",
    mistakes: "錯誤",
    notes: "筆記",
    erase: "清除",
    undo: "復原",
    hint: "提示",
    reset: "重新開始",
    finished: "棋局完成",
    finishedSub: "水星記錄了你今次的軌跡。",
    backHome: "返回主頁",
    playAgain: "再玩一局",
    totalCompleted: "完成棋局",
    bestTimes: "各難度最佳時間",
    noRecord: "尚未有紀錄",
    rewardHint: `觀看獎勵廣告 +${REWARDED_AD_HINTS} 提示`,
    prototypeAd: "廣告接口將於封裝階段接駁",
  },
  en: {
    tagline: "Find the one answer written between the orbits.",
    newGame: "New Game",
    newGameSub: "Choose a difficulty and begin",
    continue: "Continue",
    continueSub: "Return to your unfinished puzzle",
    records: "Records",
    recordsSub: "Completions and personal bests",
    daily: "Daily Challenge",
    missions: "Today's Missions",
    phase2: "Phase 2",
    selectDifficulty: "Select difficulty",
    selectSub: "Four levels powered by the original puzzle logic",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
    easyDesc: "A gentle warm-up",
    mediumDesc: "Look one step further",
    hardDesc: "Built for experienced solvers",
    expertDesc: "The full strategy challenge",
    mistakes: "Mistakes",
    notes: "Notes",
    erase: "Erase",
    undo: "Undo",
    hint: "Hint",
    reset: "Restart",
    finished: "Puzzle complete",
    finishedSub: "Mercury has recorded this orbit.",
    backHome: "Back home",
    playAgain: "Play another",
    totalCompleted: "Puzzles completed",
    bestTimes: "Personal bests",
    noRecord: "No record yet",
    rewardHint: `Watch rewarded ad +${REWARDED_AD_HINTS} hints`,
    prototypeAd: "Ad integration arrives with the app wrapper",
  },
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`}>
      <span className="brand__mark" aria-hidden="true">☿</span>
      <span>Mercurius</span>
    </div>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const [screen, setScreen] = useState<Screen>("home");
  const [theme, setTheme] = useState<Theme>(() => readJson(storage.theme, "mercury"));
  const [hints, setHints] = useState(() => readJson(storage.hints, INITIAL_HINTS));
  const [activeGame, setActiveGame] = useState<SavedGame | null>(() => readJson(storage.game, null));
  const [records, setRecords] = useState<Records>(() =>
    readJson(storage.records, { completed: 0, best: {} }),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const text = copy[locale];

  useEffect(() => localStorage.setItem(storage.hints, JSON.stringify(hints)), [hints]);
  useEffect(() => localStorage.setItem(storage.records, JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem(storage.theme, JSON.stringify(theme)), [theme]);
  useEffect(() => {
    if (activeGame) localStorage.setItem(storage.game, JSON.stringify(activeGame));
    else localStorage.removeItem(storage.game);
  }, [activeGame]);

  useEffect(() => {
    if (screen !== "game" || !activeGame || activeGame.state.completed) return;
    const timer = window.setInterval(() => {
      setActiveGame((current) => current ? { ...current, elapsed: current.elapsed + 1 } : current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, activeGame?.state.completed]);

  const puzzle = activeGame ? referencePuzzles[activeGame.difficulty] : null;
  const selectedValue = selected === null || !activeGame ? null : activeGame.state.cells[selected].value;

  const sameDigitCells = useMemo(() => {
    if (!activeGame || selectedValue === null) return new Set<number>();
    return new Set(activeGame.state.cells.flatMap((cell, index) => cell.value === selectedValue ? [index] : []));
  }, [activeGame, selectedValue]);

  function goHome() {
    setScreen("home");
    setSelected(null);
  }

  function startGame(difficulty: Difficulty) {
    setActiveGame({ difficulty, state: createGame(referencePuzzles[difficulty]), elapsed: 0, hintsUsed: 0 });
    setSelected(null);
    setNotesMode(false);
    setScreen("game");
  }

  function commitGame(state: GameState, hintDelta = 0) {
    if (!activeGame) return;
    const justCompleted = !activeGame.state.completed && state.completed;
    const nextGame = { ...activeGame, state, hintsUsed: activeGame.hintsUsed + hintDelta };
    setActiveGame(nextGame);
    if (justCompleted) {
      setRecords((current) => {
        const existing = current.best[activeGame.difficulty];
        return {
          completed: current.completed + 1,
          best: {
            ...current.best,
            [activeGame.difficulty]: existing === undefined
              ? activeGame.elapsed
              : Math.min(existing, activeGame.elapsed),
          },
        };
      });
    }
  }

  function enterDigit(digit: Digit) {
    if (!activeGame || !puzzle || selected === null) return;
    commitGame(notesMode
      ? toggleNote(activeGame.state, selected, digit)
      : placeDigit(activeGame.state, puzzle, selected, digit));
  }

  function useHint() {
    if (!activeGame || !puzzle || hints < HINT_COST) return;
    const target = selected !== null && !activeGame.state.cells[selected].given
      ? selected
      : activeGame.state.cells.findIndex((cell, index) => !cell.given && cell.value !== puzzle.solution[index]);
    if (target < 0) return;
    setSelected(target);
    setHints((value) => value - HINT_COST);
    commitGame(placeDigit(activeGame.state, puzzle, target, puzzle.solution[target]), 1);
  }

  useEffect(() => {
    if (screen !== "game") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[1-9]$/.test(event.key)) enterDigit(Number(event.key) as Digit);
      if ((event.key === "Backspace" || event.key === "Delete") && activeGame && selected !== null) {
        commitGame(eraseCell(activeGame.state, selected));
      }
      if (event.key.toLowerCase() === "n") setNotesMode((value) => !value);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && activeGame) {
        event.preventDefault();
        commitGame(undo(activeGame.state));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, activeGame, selected, notesMode]);

  function cycleTheme() {
    setTheme((current) => themes[(themes.indexOf(current) + 1) % themes.length]);
  }

  const header = (
    <header className="topbar">
      <button className="brand-button" type="button" onClick={goHome} aria-label="Mercurius home"><Logo compact /></button>
      <div className="topbar__actions">
        <span className="hint-balance" title="Hint balance">✦ {hints}</span>
        <button className="icon-button theme-button" type="button" onClick={cycleTheme} aria-label="Change theme" title="Change theme">◐</button>
        <button className="language-button" type="button" onClick={() => setLocale(locale === "zh-Hant" ? "en" : "zh-Hant")}>{locale === "zh-Hant" ? "EN" : "繁中"}</button>
      </div>
    </header>
  );

  return (
    <main className="app" data-theme={theme}>
      <div className="stars" aria-hidden="true" />
      {header}

      {screen === "home" && (
        <section className="home-screen">
          <aside className="side-rail" aria-label="Upcoming features">
            <button className="rail-card" type="button" disabled><span>◒</span><strong>{text.daily}</strong><small>{text.phase2}</small></button>
            <button className="rail-card" type="button" disabled><span>◇</span><strong>{text.missions}</strong><small>{text.phase2}</small></button>
          </aside>
          <div className="home-hero">
            <Logo />
            <p className="tagline">{text.tagline}</p>
            <div className="main-actions">
              <button className="action-card action-card--primary" type="button" onClick={() => setScreen("difficulty")}><span className="action-icon">＋</span><span><strong>{text.newGame}</strong><small>{text.newGameSub}</small></span><b>›</b></button>
              <button className="action-card" type="button" disabled={!activeGame || activeGame.state.completed} onClick={() => setScreen("game")}><span className="action-icon">▶</span><span><strong>{text.continue}</strong><small>{text.continueSub}</small></span><b>›</b></button>
              <button className="action-card" type="button" onClick={() => setScreen("records")}><span className="action-icon">⌁</span><span><strong>{text.records}</strong><small>{text.recordsSub}</small></span><b>›</b></button>
            </div>
          </div>
        </section>
      )}

      {screen === "difficulty" && (
        <section className="page-panel difficulty-screen">
          <button className="back-button" type="button" onClick={goHome}>←</button>
          <p className="eyebrow">NEW ORBIT</p>
          <h1>{text.selectDifficulty}</h1>
          <p className="page-subtitle">{text.selectSub}</p>
          <div className="difficulty-grid">
            {difficulties.map((difficulty, index) => (
              <button className={`difficulty-card difficulty-card--${difficulty}`} type="button" key={difficulty} onClick={() => startGame(difficulty)}>
                <span className="difficulty-orbit">{index + 1}</span>
                <strong>{text[difficulty]}</strong>
                <small>{text[`${difficulty}Desc` as `${Difficulty}Desc`]}</small>
                <i>{"●".repeat(index + 1)}{"○".repeat(3 - index)}</i>
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === "game" && activeGame && puzzle && (
        <section className="game-screen">
          <div className="game-heading">
            <button className="back-button" type="button" onClick={goHome}>←</button>
            <div><span>{text[activeGame.difficulty]}</span><strong>{formatTime(activeGame.elapsed)}</strong></div>
            <div className="mistake-count"><small>{text.mistakes}</small><strong>{activeGame.state.mistakes} ∞</strong></div>
          </div>
          <div className="play-layout">
            <div className="board-wrap">
              <div className="sudoku-board" role="grid" aria-label="Sudoku board">
                {activeGame.state.cells.map((cell, index) => {
                  const row = Math.floor(index / 9);
                  const col = index % 9;
                  const isPeer = selected !== null && (row === Math.floor(selected / 9) || col === selected % 9 || (Math.floor(row / 3) === Math.floor(Math.floor(selected / 9) / 3) && Math.floor(col / 3) === Math.floor((selected % 9) / 3)));
                  const wrong = cell.value !== null && cell.value !== puzzle.solution[index];
                  return (
                    <button key={index} type="button" role="gridcell" className={`cell ${cell.given ? "cell--given" : ""} ${selected === index ? "cell--selected" : ""} ${isPeer ? "cell--peer" : ""} ${sameDigitCells.has(index) ? "cell--same" : ""} ${wrong ? "cell--wrong" : ""}`} onClick={() => setSelected(index)}>
                      {cell.value ?? <span className="notes-grid">{digits.map((digit) => <i key={digit}>{cell.notes.includes(digit) ? digit : ""}</i>)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className="game-controls">
              <div className="tool-row">
                <button type="button" onClick={() => commitGame(undo(activeGame.state))}><span>↶</span>{text.undo}</button>
                <button type="button" onClick={() => selected !== null && commitGame(eraseCell(activeGame.state, selected))}><span>⌫</span>{text.erase}</button>
                <button className={notesMode ? "is-active" : ""} type="button" onClick={() => setNotesMode((value) => !value)}><span>✎</span>{text.notes}</button>
                <button type="button" onClick={useHint} disabled={hints < HINT_COST}><span>✦</span>{text.hint}</button>
              </div>
              <div className="number-pad">{digits.map((digit) => <button type="button" key={digit} onClick={() => enterDigit(digit)}>{digit}</button>)}</div>
              {hints === 0 && <div className="reward-card"><strong>{text.rewardHint}</strong><small>{text.prototypeAd}</small></div>}
              <button className="restart-button" type="button" onClick={() => startGame(activeGame.difficulty)}>{text.reset}</button>
            </aside>
          </div>
          {activeGame.state.completed && (
            <div className="completion-backdrop" role="dialog" aria-modal="true">
              <div className="completion-card"><span className="completion-mark">☿</span><p className="eyebrow">ORBIT COMPLETE</p><h2>{text.finished}</h2><p>{text.finishedSub}</p><strong className="completion-time">{formatTime(activeGame.elapsed)}</strong><div><button type="button" onClick={goHome}>{text.backHome}</button><button className="primary-button" type="button" onClick={() => setScreen("difficulty")}>{text.playAgain}</button></div></div>
            </div>
          )}
        </section>
      )}

      {screen === "records" && (
        <section className="page-panel records-screen">
          <button className="back-button" type="button" onClick={goHome}>←</button>
          <p className="eyebrow">PERSONAL LOG</p><h1>{text.records}</h1>
          <div className="record-total"><span>☿</span><strong>{records.completed}</strong><small>{text.totalCompleted}</small></div>
          <h2>{text.bestTimes}</h2>
          <div className="record-list">{difficulties.map((difficulty) => <div key={difficulty}><span>{text[difficulty]}</span><strong>{records.best[difficulty] === undefined ? text.noRecord : formatTime(records.best[difficulty]!)}</strong></div>)}</div>
        </section>
      )}
    </main>
  );
}
