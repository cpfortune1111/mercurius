import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { HINT_COST, INITIAL_HINTS, REWARDED_AD_HINTS } from "./application/rules";
import { referencePuzzles } from "./content/reference-puzzles";
import { createGame, eraseCell, isAutoFillAvailable, placeDigit, toggleNote, undo } from "./core/game";
import { applySmartHint, findSmartHint, type SmartHint } from "./core/hints";
import type { Difficulty, Digit, GameState } from "./core/types";

type Locale = "zh-Hant" | "en";
type Screen = "home" | "difficulty" | "game" | "records";
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
  completedByDifficulty: Partial<Record<Difficulty, number>>;
  totalTimeByDifficulty: Partial<Record<Difficulty, number>>;
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
const tones: readonly Tone[] = ["light", "dark", "superdark"];
const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
const toneIcons: Readonly<Record<Tone, string>> = {
  light: assetPath("icon-theme.png"),
  dark: assetPath("icon-theme-dark.png"),
  superdark: assetPath("icon-theme-superdark.png"),
};
const difficultyIcons: Readonly<Record<Difficulty, string>> = {
  easy: assetPath("icon-diff-easy.png"),
  medium: assetPath("icon-diff-medium.png"),
  hard: assetPath("icon-diff-hard.png"),
  expert: assetPath("icon-diff-expert.png"),
};
const storage = {
  game: "mercurius.active-game.v1",
  hints: "mercurius.hints.v1",
  records: "mercurius.records.v1",
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
    autoFill: "自動完成",
    autoFillSub: "完成餘下正確答案",
    reset: "重新開始",
    finished: "棋局完成",
    finishedSub: "水星記錄了你今次的軌跡。",
    backHome: "返回主頁",
    playAgain: "再玩一局",
    totalCompleted: "完成棋局",
    bestTimes: "各難度紀錄",
    bestTime: "最佳時間",
    averageTime: "平均完成時間",
    completedCount: "完成次數",
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
    autoFill: "Auto Fill",
    autoFillSub: "Complete the remaining cells",
    reset: "Restart",
    finished: "Puzzle complete",
    finishedSub: "Mercury has recorded this orbit.",
    backHome: "Back home",
    playAgain: "Play another",
    totalCompleted: "Puzzles completed",
    bestTimes: "Records by difficulty",
    bestTime: "Best time",
    averageTime: "Average time",
    completedCount: "Completed",
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

function readRecords(): Records {
  const saved = readJson<Partial<Records>>(storage.records, {});
  const best = saved.best ?? {};
  const completedByDifficulty = { ...(saved.completedByDifficulty ?? {}) };
  const totalTimeByDifficulty = { ...(saved.totalTimeByDifficulty ?? {}) };
  for (const difficulty of difficulties) {
    if (completedByDifficulty[difficulty] === undefined && best[difficulty] !== undefined) {
      completedByDifficulty[difficulty] = 1;
      totalTimeByDifficulty[difficulty] = best[difficulty];
    }
  }
  return {
    completed: saved.completed ?? 0,
    best,
    completedByDifficulty,
    totalTimeByDifficulty,
  };
}

function GameLogo() {
  return (
    <img className="game-logo" src={assetPath("mercurius-sudoku-logo.png")} alt="Mercurius Sudoku" />
  );
}

const titleLetters = [
  { left: 0, top: 1.8, width: 103.8, height: 120 },
  { left: 75.8, top: 27, width: 83.4, height: 94.8 },
  { left: 151.2, top: 27, width: 85.8, height: 94.8 },
  { left: 229, top: 0, width: 83.4, height: 121.8 },
  { left: 304.4, top: 1.2, width: 39.6, height: 120.6 },
  { left: 336, top: 27, width: 85.8, height: 94.8 },
  { left: 413.8, top: 27, width: 93, height: 94.8 },
  { left: 498.8, top: 0, width: 111.6, height: 121.8 },
  { left: 602.4, top: 1.2, width: 39.6, height: 120.6 },
  { left: 634, top: 7.2, width: 61.2, height: 61.2 },
] as const;

function TitleIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="title-intro" aria-hidden="true">
      <div className="title-intro__letters">
        {titleLetters.map((letter, index) => (
          <img
            className="title-intro__letter"
            key={index}
            src={assetPath(`title-letters/letter-${index}.webp`)}
            alt=""
            style={{
              "--letter-left": `${(letter.left / 695.2) * 100}%`,
              "--letter-top": `${(letter.top / 121.8) * 100}%`,
              "--letter-width": `${(letter.width / 695.2) * 100}%`,
              "--letter-height": `${(letter.height / 121.8) * 100}%`,
              "--letter-delay": `${100 + index * 83}ms`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <button className="toggle-button" type="button" role="switch" aria-checked={value} aria-label={label} onClick={onChange}>
      <span>{value ? "ON" : "OFF"}</span>
      <img src={assetPath(value ? "icon-on.png" : "icon-off.png")} alt={value ? "On" : "Off"} />
    </button>
  );
}

interface TouchSpark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotation: number;
  scale: number;
  lifeMs: number;
  kind: "bubble" | "sign" | "spark02";
}

const touchParticleSources: Readonly<Record<TouchSpark["kind"], string>> = {
  bubble: assetPath("spark-bubble.png"),
  sign: assetPath("spark-mercury-sign.png"),
  spark02: assetPath("ani-spark-02.png"),
};

function TouchFx() {
  const [sparks, setSparks] = useState<TouchSpark[]>([]);
  const nextId = useRef(0);
  const pointerActive = useRef(false);
  const pointerPosition = useRef({ x: 0, y: 0 });
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    const stopHold = () => {
      pointerActive.current = false;
      if (holdTimer.current !== null) {
        window.clearInterval(holdTimer.current);
        holdTimer.current = null;
      }
    };

    const spawnBurst = () => {
      if (!pointerActive.current) return;
      const { x, y } = pointerPosition.current;
      const particleSystems = [
        { kind: "spark02", count: 10, startSpeed: 1.1, speedModifier: 1 },
        { kind: "sign", count: 4, startSpeed: 1.4, speedModifier: .4 },
        { kind: "bubble", count: 10, startSpeed: 1.4, speedModifier: .6 },
      ] as const;
      const pixelsPerUnityUnit = 56;
      const batch = particleSystems.flatMap(({ kind, count, startSpeed, speedModifier }) =>
        Array.from({ length: count }, (): TouchSpark => {
          const angle = Math.random() * Math.PI * 2;
          const shapeAngle = Math.random() * Math.PI * 2;
          const shapeRadius = Math.sqrt(Math.random()) * .1 * pixelsPerUnityUnit;
          const lifeMs = 100 + Math.random() * 300;
          const distance = startSpeed * speedModifier * (lifeMs / 1000) * pixelsPerUnityUnit;
          return {
            id: nextId.current++,
            x: x + Math.cos(shapeAngle) * shapeRadius,
            y: y + Math.sin(shapeAngle) * shapeRadius,
            dx: Math.cos(angle) * distance,
            dy: Math.sin(angle) * distance,
            rotation: Math.random() * 45 * (lifeMs / 1000),
            scale: 1,
            lifeMs,
            kind,
          };
        }),
      );
      const ids = new Set(batch.map((spark) => spark.id));
      setSparks((current) => [...current.slice(-96), ...batch]);
      const maxLifeMs = Math.max(...batch.map((spark) => spark.lifeMs));
      window.setTimeout(() => {
        setSparks((current) => current.filter((spark) => !ids.has(spark.id)));
      }, maxLifeMs + 80);
    };

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      stopHold();
      pointerActive.current = true;
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      spawnBurst();
      holdTimer.current = window.setInterval(spawnBurst, 150);
    };
    const onMove = (event: PointerEvent) => {
      if (!pointerActive.current || !event.isPrimary) return;
      pointerPosition.current = { x: event.clientX, y: event.clientY };
    };
    const onUp = () => stopHold();
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    return () => {
      stopHold();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, []);

  return (
    <div className="touch-fx-layer" aria-hidden="true">
      {sparks.map((spark) => (
        <span
          className="touch-spark"
          key={spark.id}
          style={{
            left: spark.x,
            top: spark.y,
            "--spark-x": `${spark.dx}px`,
            "--spark-y": `${spark.dy}px`,
            "--spark-rotation": `${spark.rotation}deg`,
            "--spark-scale": spark.scale,
            "--spark-duration": `${spark.lifeMs}ms`,
          } as CSSProperties}
        >
          <img
            className={`touch-spark__particle touch-spark__${spark.kind}`}
            src={touchParticleSources[spark.kind]}
            alt=""
          />
        </span>
      ))}
    </div>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const [screen, setScreen] = useState<Screen>("home");
  const [tone, setTone] = useState<Tone>(() => readJson(storage.tone, "dark"));
  const [hints, setHints] = useState(() =>
    import.meta.env.DEV ? DEV_HINTS : readJson(storage.hints, INITIAL_HINTS),
  );
  const [activeGame, setActiveGame] = useState<SavedGame | null>(() => readJson(storage.game, null));
  const [records, setRecords] = useState<Records>(readRecords);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [activeHint, setActiveHint] = useState<SmartHint | null>(null);
  const [hintPage, setHintPage] = useState(0);
  const [autoFilling, setAutoFilling] = useState(false);
  const [completionOrigin, setCompletionOrigin] = useState<number | null>(null);
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
  const showAutoFill = Boolean(activeGame && puzzle && isAutoFillAvailable(activeGame.state, puzzle));

  function goHome() {
    setActiveHint(null);
    setScreen("home");
    setSelected(null);
  }

  function startGame(difficulty: Difficulty) {
    setActiveHint(null);
    setAutoFilling(false);
    setCompletionOrigin(null);
    setActiveGame({ difficulty, state: createGame(referencePuzzles[difficulty]), elapsed: 0, hintsUsed: 0 });
    setSelected(null);
    setNotesMode(false);
    setScreen("game");
  }

  function commitGame(state: GameState, hintDelta = 0, completedAt = selected) {
    if (!activeGame) return;
    const justCompleted = !activeGame.state.completed && state.completed;
    setActiveGame((current) => current ? {
      ...current,
      state,
      hintsUsed: current.hintsUsed + hintDelta,
    } : current);
    if (justCompleted) {
      setCompletionOrigin(completedAt);
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
          completedByDifficulty: {
            ...current.completedByDifficulty,
            [activeGame.difficulty]: (current.completedByDifficulty[activeGame.difficulty] ?? 0) + 1,
          },
          totalTimeByDifficulty: {
            ...current.totalTimeByDifficulty,
            [activeGame.difficulty]: (current.totalTimeByDifficulty[activeGame.difficulty] ?? 0) + activeGame.elapsed,
          },
        };
      });
    }
  }

  function enterDigit(digit: Digit) {
    if (!activeGame || !puzzle || selected === null || autoFilling) return;
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
    const completedAt = activeHint.edits.find((edit) => edit.value !== undefined && edit.value !== null)?.index ?? selected;
    commitGame(applySmartHint(activeGame.state, puzzle, activeHint), 0, completedAt);
    setActiveHint(null);
    setHintPage(0);
  }

  async function autoFillRemaining() {
    if (!activeGame || !puzzle || autoFilling || !isAutoFillAvailable(activeGame.state, puzzle)) return;
    const emptyCells = activeGame.state.cells.flatMap((cell, index) => cell.value === null ? [index] : []);
    if (emptyCells.length === 0) return;
    setAutoFilling(true);
    let state = activeGame.state;
    for (const [position, index] of emptyCells.entries()) {
      state = placeDigit(state, puzzle, index, puzzle.solution[index]);
      setSelected(index);
      if (position < emptyCells.length - 1) {
        setActiveGame((current) => current ? { ...current, state } : current);
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
    }
    commitGame(state, 0, emptyCells.at(-1) ?? selected);
    setAutoFilling(false);
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
      if (activeHint || settingsOpen || autoFilling) return;
      if (/^[1-9]$/.test(event.key)) enterDigit(Number(event.key) as Digit);
      if (showAutoFill) return;
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
  }, [screen, activeGame, selected, notesMode, activeHint, settingsOpen, autoFilling, showAutoFill]);

  function cycleTone() {
    setTone((current) => tones[(tones.indexOf(current) + 1) % tones.length]);
  }

  const header = (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__settings" type="button" onClick={() => setSettingsOpen(true)} aria-label={text.settings} title={text.settings}><img src={assetPath("icon-settings.png")} alt="" /></button>
        <button className="icon-button records-button" type="button" onClick={() => setScreen("records")} aria-label={text.records} title={text.records}><img src={assetPath("icon-records.png")} alt="" /></button>
      </div>
      <a className="studio-link" href="https://tsukinoaiplus.com" target="_blank" rel="noreferrer" aria-label="Tsukino Ai Plus website">
        <img src={assetPath("tsukinoaiplus-logo.png")} alt="Tsukino Ai Plus" />
      </a>
      <div className="topbar__actions">
        <button className="language-button" type="button" onClick={() => setLocale(locale === "zh-Hant" ? "en" : "zh-Hant")}>{locale === "zh-Hant" ? "EN" : "繁中"}</button>
        <button className="icon-button theme-button" type="button" onClick={cycleTone} aria-label="Change color tone" title={`Tone: ${tone}`}><img src={toneIcons[tone]} alt="" /></button>
      </div>
    </header>
  );

  return (
    <main className="app" data-tone={tone} data-screen={screen} data-locale={locale}>
      <TitleIntro />
      <div className="stars" aria-hidden="true" />
      <TouchFx />
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
                <span className="difficulty-orbit"><img src={difficultyIcons[difficulty]} alt="" /></span>
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
              <div className={`sudoku-board ${activeGame.state.completed && completionOrigin !== null ? "board--completed" : ""}`} role="grid" aria-label="Sudoku board">
                {activeGame.state.cells.map((cell, index) => {
                  const row = Math.floor(index / 9);
                  const col = index % 9;
                  const isPeer = selected !== null && (row === Math.floor(selected / 9) || col === selected % 9 || (Math.floor(row / 3) === Math.floor(Math.floor(selected / 9) / 3) && Math.floor(col / 3) === Math.floor((selected % 9) / 3)));
                  const wrong = cell.value !== null && cell.value !== puzzle.solution[index];
                  const rippleDelay = completionOrigin === null ? 0 : Math.hypot(
                    row - Math.floor(completionOrigin / 9),
                    col - completionOrigin % 9,
                  ) * 0.1;
                  return (
                    <button key={index} type="button" role="gridcell" disabled={autoFilling || activeGame.state.completed} style={{ "--ripple-delay": `${rippleDelay}s` } as CSSProperties} className={`cell ${cell.given ? "cell--given" : ""} ${selected === index ? "cell--selected" : ""} ${isPeer ? "cell--peer" : ""} ${sameDigitCells.has(index) ? "cell--same" : ""} ${preferences.showMistakes && wrong ? "cell--wrong" : ""} ${hintHighlights.has(index) ? `cell--hint-${hintHighlights.get(index)}` : ""}`} onClick={() => setSelected(index)}>
                      {cell.value ?? <span className="notes-grid">{digits.map((digit) => <i className={selectedValue === digit && cell.notes.includes(digit) ? "note--highlighted" : ""} key={digit}>{cell.notes.includes(digit) ? digit : ""}</i>)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <aside className="game-controls">
              {showAutoFill || autoFilling ? (
                <button className="auto-fill-button" type="button" onClick={autoFillRemaining} disabled={autoFilling}>
                  <span>{autoFilling ? "•••" : "✦"}</span><strong>{text.autoFill}</strong><small>{text.autoFillSub}</small>
                </button>
              ) : (
                <div className="tool-row">
                  <button type="button" aria-keyshortcuts="Backspace" onClick={() => commitGame(undo(activeGame.state))}><span><img src={assetPath("icon-refresh.png")} alt="" /></span>{text.undo}</button>
                  <button type="button" aria-keyshortcuts="Delete" onClick={() => selected !== null && commitGame(eraseCell(activeGame.state, selected))}><span><img src={assetPath("icon-eraser.png")} alt="" /></span>{text.erase}</button>
                  <button className={notesMode ? "is-active" : ""} type="button" aria-keyshortcuts="N" onClick={() => setNotesMode((value) => !value)}><span className="notes-tool-icon"><img src={assetPath("icon-notes.png")} alt="" /><em className={notesMode ? "is-on" : "is-off"}>{notesMode ? "ON" : "OFF"}</em></span>{text.notes}</button>
                  <button type="button" aria-keyshortcuts="H" onClick={useHint} disabled={hints < HINT_COST}><span className="hint-tool-icon"><img src={assetPath("icon-hint.png")} alt="" /><em>{hints}</em></span>{text.hint}</button>
                </div>
              )}
              <div className="number-pad">{digits.map((digit) => <button disabled={autoFilling || activeGame.state.completed} className={preferences.hideNumberButtons && completedDigits.has(digit) ? "number-pad__hidden" : ""} type="button" key={digit} onClick={() => enterDigit(digit)}>{digit}</button>)}</div>
              {hints === 0 && <div className="reward-card"><strong>{text.rewardHint}</strong><small>{text.prototypeAd}</small></div>}
            </aside>
          </div>
          {activeGame.state.completed && (
            <div className={`completion-backdrop ${completionOrigin !== null ? "completion-backdrop--delayed" : ""}`} role="dialog" aria-modal="true">
              <div className="completion-card"><span className="completion-mark">☿</span><p className="eyebrow">ORBIT COMPLETE</p><h2>{text.finished}</h2><p>{text.finishedSub}</p><strong className="completion-time">{formatTime(activeGame.elapsed)}</strong><div><button type="button" onClick={goHome}>{text.backHome}</button><button className="primary-button" type="button" onClick={() => setScreen("difficulty")}>{text.playAgain}</button></div></div>
            </div>
          )}
          {activeHint && (() => {
            const localizedHint = activeHint.copy[locale];
            const lastPage = localizedHint.pages.length - 1;
            return (
              <div className="hint-backdrop" role="dialog" aria-labelledby="hint-title">
                <div className="hint-window">
                  <div className="hint-meter-mask" aria-hidden="true"><span /></div>
                  <p className="eyebrow">{text.hintGuide}</p>
                  <h2 id="hint-title">{localizedHint.title}<span className="hint-symbol" aria-hidden="true">✦</span></h2>
                  <div className="hint-step">
                    <span>{text.hintPage} {hintPage + 1} / {localizedHint.pages.length}</span>
                    <div>{localizedHint.pages.map((_, index) => <i className={index === hintPage ? "is-current" : ""} key={index} />)}</div>
                  </div>
                  <p className="hint-explanation" key={hintPage}>{localizedHint.pages[hintPage]}</p>
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
          <div className="record-list">{difficulties.map((difficulty) => {
            const count = records.completedByDifficulty[difficulty] ?? 0;
            const average = count > 0 ? Math.round((records.totalTimeByDifficulty[difficulty] ?? 0) / count) : null;
            return <div className="record-row" key={difficulty}>
              <strong className="record-row__level">{text[difficulty]}</strong>
              <span><small>{text.bestTime}</small><b>{records.best[difficulty] === undefined ? text.noRecord : formatTime(records.best[difficulty]!)}</b></span>
              <span><small>{text.averageTime}</small><b>{average === null ? text.noRecord : formatTime(average)}</b></span>
              <span><small>{text.completedCount}</small><b>{count}</b></span>
            </div>;
          })}</div>
        </section>
      )}

      {settingsOpen && (
        <div className="completion-backdrop" role="dialog" aria-modal="true" aria-label={text.settings} onClick={() => setSettingsOpen(false)}>
          <div className="settings-card" onClick={(event) => event.stopPropagation()}>
            <button className="settings-close" type="button" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            <h2>{text.settings}</h2>
            <div className="sound-master">
              <span className="sound-master__title"><strong>{text.sound}</strong><img src={assetPath("icon-music.png")} alt="" /></span>
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
