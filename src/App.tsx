import { useState } from "react";

const copy = {
  "zh-Hant": {
    eyebrow: "WEB-FIRST REMAKE",
    title: "Mercurius Sudoku",
    subtitle: "保留原作靈魂，為 Web 與未來 App 重新打造。",
    status: "工程基礎已建立",
    engine: "獨立 Sudoku 核心",
    tests: "規則與舊版題目測試",
    next: "下一步：互動棋盤 Prototype",
    language: "EN",
  },
  en: {
    eyebrow: "WEB-FIRST REMAKE",
    title: "Mercurius Sudoku",
    subtitle: "The original spirit, rebuilt for the web and future apps.",
    status: "Foundation established",
    engine: "Independent Sudoku core",
    tests: "Rules and legacy puzzle tests",
    next: "Next: interactive board prototype",
    language: "繁中",
  },
} as const;

type Locale = keyof typeof copy;

export function App() {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const text = copy[locale];

  return (
    <main className="shell">
      <button
        className="language-button"
        type="button"
        onClick={() => setLocale(locale === "zh-Hant" ? "en" : "zh-Hant")}
      >
        {text.language}
      </button>

      <section className="hero" aria-labelledby="page-title">
        <div className="mercury-mark" aria-hidden="true">☿</div>
        <p className="eyebrow">{text.eyebrow}</p>
        <h1 id="page-title">{text.title}</h1>
        <p className="subtitle">{text.subtitle}</p>

        <div className="status-card">
          <span className="status-dot" aria-hidden="true" />
          <strong>{text.status}</strong>
        </div>

        <div className="foundation-grid">
          <article>{text.engine}</article>
          <article>{text.tests}</article>
        </div>

        <p className="next-step">{text.next}</p>
      </section>
    </main>
  );
}
