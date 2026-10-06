import { useEffect, useMemo, useState } from "react";
import { HINT_COST, INITIAL_HINTS, REWARDED_AD_HINTS } from "./application/rules";
import { referencePuzzles } from "./content/reference-puzzles";
import { createGame, eraseCell, placeDigit, toggleNote, undo } from "./core/game";
import { applySmartHint, findSmartHint, type SmartHint } from "./core/hints";
import type { Difficulty, Digit, GameState } from "./core/types";

type Locale = "zh-Hant" | "en";
type Screen = "home" | "difficulty" | "game" | "records";
type Skin = "mercury" | "aurora" | "dawn" | "graphite";
type Tone = "light" | "dark" | "superdark";

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

interface Preferences {
  sound: boolean;
  bgmVolume: number;
  sfxVolume: number;
  showMistakes: boolean;
  hideNumberButtons: boolean;
}

const digits: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const DEV_HINTS = 9999;
const difficulties: readonly Difficulty[] = ["easy", "medium", "hard", "expert"];
const skins: readonly Skin[] = ["mercury", "aurora", "dawn", "graphite"];
const tones: readonly Tone[] = ["light", "dark", "superdark"];
const toneIcons: Readonly<Record<Tone, string>> = {
  light: "/icon-theme.png",
  dark: "/icon-theme-dark.png",
  superdark: "/icon-theme-superdark.png",
};
const storage = {
  game: "mercurius.active-game.v1",
  hints: "mercurius.hints.v1",
  records: "mercurius.records.v1",
  theme: "mercurius.theme.v1",
  tone: "mercurius.tone.v1",
  preferences: "mercurius.preferences.v1",
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
    settings: "設定",
    sound: "聲音",
    bgm: "背景音樂",
    sfx: "音效",
    showMistakes: "顯示錯誤",
    showMistakesSub: "輸入錯誤時以紅色標示",
    hideNumberButtons: "隱藏已完成數字",
    hideNumberButtonsSub: "正確填滿 9 次後隱藏數字鍵",
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
    hintGuide: "解題提示",
    hintBack: "上一頁",
    hintNext: "下一頁",
    hintApply: "套用提示",
    hintClose: "關閉提示",
    hintPage: "步驟",
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
    settings: "Settings",
    sound: "Sound",
    bgm: "BGM",
    sfx: "SFX",
    showMistakes: "Show mistakes",
    showMistakesSub: "Highlight incorrect entries in red",
    hideNumberButtons: "Hide number buttons",
    hideNumberButtonsSub: "Hide a digit after all nine are correct",
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
    hintGuide: "Solving Hint",
    hintBack: "Back",
    hintNext: "Next",
    hintApply: "Apply Hint",
    hintClose: "Close hint",
    hintPage: "Step",
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

function GameLogo() {
  return (
    <img className="game-logo" src="/mercurius-sudoku-logo.png" alt="Mercurius Sudoku" />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <button className="toggle-button" type="button" role="switch" aria-checked={value} aria-label={label} onClick={onChange}>
      <img src={value ? "/icon-on.png" : "/icon-off.png"} alt={value ? "On" : "Off"} />
    </button>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const [screen, setScreen] = useState<Screen>("home");
  const [skin, setSkin] = useState<Skin>(() => readJson(storage.theme, "mercury"));
  const [tone, setTone] = useState<Tone>(() => readJson(storage.tone, "dark"));
  const [hints, setHints] = useState(() =>
    import.meta.env.DEV ? DEV_HINTS : readJson(storage.hints, INITIAL_HINTS),
  );
  const [activeGame, setActiveGame] = useState<SavedGame | null>(() => readJson(storage.game, null));
  const [records, setRecords] = useState<Records>(() =>
    readJson(storage.records, { completed: 0, best: {} }),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [activeHint, setActiveHint] = useState<SmartHint | null>(null);
  const [hintPage, setHintPage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(() => readJson(storage.preferences, {
    sound: true,
    bgmVolume: 70,
    sfxVolume: 80,
    showMistakes: true,
    hideNumberButtons: true,
  }));
  const text = copy[locale];

  useEffect(() => {
    if (import.meta.env.DEV) setHints((current) => Math.max(current, DEV_HINTS));
  }, []);
  useEffect(() => localStorage.setItem(storage.hints, JSON.stringify(hints)), [hints]);
  useEffect(() => localStorage.setItem(storage.records, JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem(storage.theme, JSON.stringify(skin)), [skin]);
  useEffect(() => localStorage.setItem(storage.tone, JSON.stringify(tone)), [tone]);
  useEffect(() => localStorage.setItem(storage.preferences, JSON.stringify(preferences)), [preferences]);
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

  const completedDigits = useMemo(() => {
    if (!activeGame || !puzzle) return new Set<Digit>();
    return new Set(digits.filter((digit) =>
      activeGame.state.cells.filter((cell, index) => cell.value === digit && puzzle.solution[index] === digit).length === 9,
    ));
  }, [activeGame, puzzle]);

  const hintHighlights = useMemo(() => new Map(
    activeHint?.highlights.map((highlight) => [highlight.index, highlight.type]) ?? [],
  ), [activeHint]);

  function goHome() {
    setActiveHint(null);
    setScreen("home");
    setSelected(null);
  }

  function startGame(difficulty: Difficulty) {
    setActiveHint(null);
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
    if (!activeGame || !puzzle || hints < HINT_COST || activeHint) return;
    const hint = findSmartHint(activeGame.state, puzzle);
    if (!hint) return;
    setHints((value) => value - HINT_COST);
    setActiveGame({ ...activeGame, hintsUsed: activeGame.hintsUsed + 1 });
    setActiveHint(hint);
    setHintPage(0);
  }

  function applyHint() {
    if (!activeGame || !puzzle || !activeHint) return;
    commitGame(applySmartHint(activeGame.state, puzzle, activeHint));
    setActiveHint(null);
    setHintPage(0);
  }

  useEffect(() => {
    if (screen !== "game") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (activeHint) {
          setActiveHint(null);
          setHintPage(0);
        } else {
          goHome();
        }
        return;
      }
      if (activeHint || settingsOpen) return;
      if (/^[1-9]$/.test(event.key)) enterDigit(Number(event.key) as Digit);
      if (event.key === "Backspace" && activeGame) {
        event.preventDefault();
        commitGame(undo(activeGame.state));
      }
      if (event.key === "Delete" && activeGame && selected !== null) {
        event.preventDefault();
        commitGame(eraseCell(activeGame.state, selected));
      }
      if (event.key.toLowerCase() === "n") setNotesMode((value) => !value);
      if (event.key.toLowerCase() === "h") useHint();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && activeGame) {
        event.preventDefault();
        commitGame(undo(activeGame.state));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, activeGame, selected, notesMode, activeHint, settingsOpen]);

  function cycleSkin() {
    setSkin((current) => skins[(skins.indexOf(current) + 1) % skins.length]);
  }

  function cycleTone() {
    setTone((current) => tones[(tones.indexOf(current) + 1) % tones.length]);
  }

  const header = (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__settings" type="button" onClick={() => setSettingsOpen(true)} aria-label={text.settings} title={text.settings}><img src="/icon-settings.png" alt="" /></button>
        <button className="icon-button records-button" type="button" onClick={() => setScreen("records")} aria-label={text.records} title={text.records}><img src="/icon-records.png" alt="" /></button>
      </div>
      <a className="studio-link" href="https://tsukinoaiplus.com" target="_blank" rel="noreferrer" aria-label="Tsukino Ai Plus website">
        <img src="/tsukinoaiplus-logo.png" alt="Tsukino Ai Plus" />
      </a>
      <div className="topbar__actions">
        <button className="language-button" type="button" onClick={() => setLocale(locale === "zh-Hant" ? "en" : "zh-Hant")}>{locale === "zh-Hant" ? "EN" : "繁中"}</button>
        <button className="icon-button skin-button" type="button" onClick={cycleSkin} aria-label="Change skin" title={`Skin: ${skin}`}><img src="/icon-skin.png" alt="" /></button>
        <button className="icon-button theme-button" type="button" onClick={cycleTone} aria-label="Change color tone" title={`Tone: ${tone}`}><img src={toneIcons[tone]} alt="" /></button>
      </div>
    </header>
  );

  return (
    <main className="app" data-skin={skin} data-tone={tone}>
      <div className="stars" aria-hidden="true" />
      {header}

      {screen === "home" && (
        <section className="home-screen">
          <aside className="side-rail" aria-label="Upcoming features">
            <button className="rail-card" type="button" disabled><span>◇</span><strong>{text.missions}</strong><small>{text.phase2}</small></button>
          </aside>
          <div className="home-hero">
            <GameLogo />
            <p className="tagline">{text.tagline}</p>
            <div className="main-actions">
              <button className="action-card action-card--daily" type="button" disabled><span className="action-icon">◒</span><span><strong>{text.daily}</strong><small>{text.phase2}</small></span><b>›</b></button>
              <button className="action-card action-card--primary" type="button" onClick={() => setScreen("difficulty")}><span className="action-icon">＋</span><span><strong>{text.newGame}</strong><small>{text.newGameSub}</small></span><b>›</b></button>
              <button className="action-card" type="button" disabled={!activeGame || activeGame.state.completed} onClick={() => setScreen("game")}><span className="action-icon">▶</span><span><strong>{text.continue}</strong><small>{text.continueSub}</small></span><b>›</b></button>
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
            <button className="back-button" type="button" onClick={goHome} aria-keyshortcuts="Escape">←</button>
            <div><span>{text[activeGame.difficulty]}</span><strong>{formatTime(activeGame.elapsed)}</strong></div>
            <div className="game-status-actions">
              <div className="mistake-count"><strong>{activeGame.state.mistakes}</strong><small>{text.mistakes}</small></div>
              <button className="header-reset" type="button" onClick={() => startGame(activeGame.difficulty)}><span>↻</span><small>{text.reset}</small></button>
            </div>
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
                    <button key={index} type="button" role="gridcell" className={`cell ${cell.given ? "cell--given" : ""} ${selected === index ? "cell--selected" : ""} ${isPeer ? "cell--peer" : ""} ${sameDigitCells.has(index) ? "cell--same" : ""} ${preferences.showMistakes && wrong ? "cell--wrong" : ""} ${hintHighlights.has(index) ? `cell--hint-${hintHighlights.get(index)}` : ""}`} onClick={() => setSelected(index)}>
                      {cell.value ?? <span className="notes-grid">{digits.map((digit) => <i className={selectedValue === digit && cell.notes.includes(digit) ? "note--highlighted" : ""} key={digit}>{cell.notes.includes(digit) ? digit : ""}</i>)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className="game-controls">
              <div className="tool-row">
                <button type="button" aria-keyshortcuts="Backspace" onClick={() => commitGame(undo(activeGame.state))}><span>↶</span>{text.undo}</button>
                <button type="button" aria-keyshortcuts="Delete" onClick={() => selected !== null && commitGame(eraseCell(activeGame.state, selected))}><span>⌫</span>{text.erase}</button>
                <button className={notesMode ? "is-active" : ""} type="button" aria-keyshortcuts="N" onClick={() => setNotesMode((value) => !value)}><span>✎</span>{text.notes}</button>
                <button type="button" aria-keyshortcuts="H" onClick={useHint} disabled={hints < HINT_COST}><span className="hint-tool-icon">✦<em>{hints}</em></span>{text.hint}</button>
              </div>
              <div className="number-pad">{digits.map((digit) => <button className={preferences.hideNumberButtons && completedDigits.has(digit) ? "number-pad__hidden" : ""} type="button" key={digit} onClick={() => enterDigit(digit)}>{digit}</button>)}</div>
              {hints === 0 && <div className="reward-card"><strong>{text.rewardHint}</strong><small>{text.prototypeAd}</small></div>}
            </aside>
          </div>
          {activeGame.state.completed && (
            <div className="completion-backdrop" role="dialog" aria-modal="true">
              <div className="completion-card"><span className="completion-mark">☿</span><p className="eyebrow">ORBIT COMPLETE</p><h2>{text.finished}</h2><p>{text.finishedSub}</p><strong className="completion-time">{formatTime(activeGame.elapsed)}</strong><div><button type="button" onClick={goHome}>{text.backHome}</button><button className="primary-button" type="button" onClick={() => setScreen("difficulty")}>{text.playAgain}</button></div></div>
            </div>
          )}
          {activeHint && (() => {
            const localizedHint = activeHint.copy[locale];
            const lastPage = localizedHint.pages.length - 1;
            return (
              <div className="hint-backdrop" role="dialog" aria-labelledby="hint-title">
                <div className="hint-window">
                  <button className="hint-close" type="button" onClick={() => setActiveHint(null)} aria-label={text.hintClose}>×</button>
                  <span className="hint-symbol">✦</span>
                  <p className="eyebrow">{text.hintGuide}</p>
                  <h2 id="hint-title">{localizedHint.title}</h2>
                  <div className="hint-step">
                    <span>{text.hintPage} {hintPage + 1} / {localizedHint.pages.length}</span>
                    <div>{localizedHint.pages.map((_, index) => <i className={index === hintPage ? "is-current" : ""} key={index} />)}</div>
                  </div>
                  <p className="hint-explanation">{localizedHint.pages[hintPage]}</p>
                  <div className="hint-legend">
                    {activeHint.highlights.some((item) => item.type === "key") && <span><i className="legend-key" />{locale === "zh-Hant" ? "重點格" : "Key cell"}</span>}
                    {activeHint.highlights.some((item) => item.type === "auxiliary") && <span><i className="legend-auxiliary" />{locale === "zh-Hant" ? "候選格" : "Candidate cells"}</span>}
                    {activeHint.highlights.some((item) => item.type === "eliminate" || item.type === "error") && <span><i className="legend-remove" />{locale === "zh-Hant" ? "要修正" : "Change"}</span>}
                  </div>
                  <div className="hint-actions">
                    <button type="button" disabled={hintPage === 0} onClick={() => setHintPage((page) => Math.max(0, page - 1))}>{text.hintBack}</button>
                    {hintPage < lastPage
                      ? <button className="primary-button" type="button" onClick={() => setHintPage((page) => Math.min(lastPage, page + 1))}>{text.hintNext}</button>
                      : <button className="primary-button" type="button" onClick={applyHint}>{text.hintApply}</button>}
                  </div>
                </div>
              </div>
            );
          })()}
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

      {settingsOpen && (
        <div className="completion-backdrop" role="dialog" aria-modal="true" aria-label={text.settings} onClick={() => setSettingsOpen(false)}>
          <div className="settings-card" onClick={(event) => event.stopPropagation()}>
            <button className="settings-close" type="button" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            <h2>{text.settings}</h2>
            <div className="sound-master">
              <img src="/icon-music.png" alt="" />
              <strong>{text.sound}</strong>
              <Toggle value={preferences.sound} label={text.sound} onChange={() => setPreferences((current) => ({ ...current, sound: !current.sound }))} />
            </div>
            <div className={`volume-controls ${preferences.sound ? "" : "is-disabled"}`}>
              <label><span>{text.bgm}</span><input type="range" min="0" max="100" value={preferences.bgmVolume} disabled={!preferences.sound} onChange={(event) => setPreferences((current) => ({ ...current, bgmVolume: Number(event.target.value) }))} /></label>
              <label><span>{text.sfx}</span><input type="range" min="0" max="100" value={preferences.sfxVolume} disabled={!preferences.sound} onChange={(event) => setPreferences((current) => ({ ...current, sfxVolume: Number(event.target.value) }))} /></label>
            </div>
            <div className="setting-toggle-row">
              <span><strong>{text.showMistakes}</strong><small>{text.showMistakesSub}</small></span>
              <Toggle value={preferences.showMistakes} label={text.showMistakes} onChange={() => setPreferences((current) => ({ ...current, showMistakes: !current.showMistakes }))} />
            </div>
            <div className="setting-toggle-row">
              <span><strong>{text.hideNumberButtons}</strong><small>{text.hideNumberButtonsSub}</small></span>
              <Toggle value={preferences.hideNumberButtons} label={text.hideNumberButtons} onChange={() => setPreferences((current) => ({ ...current, hideNumberButtons: !current.hideNumberButtons }))} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
