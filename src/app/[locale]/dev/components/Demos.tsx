"use client";

import { Chess, type Square } from "chess.js";
import { RotateCcw, Share2, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { Board, type BoardMove, type BoardShape, type SquareMark } from "@/components/board/Board";
import { SanLine } from "@/components/chess/San";
import { CoachBubble } from "@/components/coach/CoachBubble";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";

const START = new Chess().fen();

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`chip min-h-9 px-3 ${on ? "!bg-accent-soft !text-accent-text" : ""}`}>
      {label}
    </button>
  );
}

export function DemoCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card flex min-w-0 flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Free play: legal moves, flip, quick moves, sounds, arrows. */
export function FreePlayDemo() {
  const t = useTranslations("devComponents.board");
  const [history, setHistory] = useState<string[]>([]);
  const [last, setLast] = useState<[Square, Square] | undefined>();
  const [flipped, setFlipped] = useState(false);
  const [quick, setQuick] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [arrows, setArrows] = useState(true);

  const fen = useMemo(() => {
    const g = new Chess();
    for (const m of history) g.move(m);
    return g.fen();
  }, [history]);

  // Demo arrows at the start: main idea d4 (best), alternative c4, and a circle on e4.
  const shapes: BoardShape[] = arrows && history.length === 0 ? [{ from: "d2", to: "d4", tone: "best" }, { from: "c2", to: "c4", tone: "alt" }, { from: "e4" }] : [];

  return (
    <DemoCard title={t("title")} hint={t("hint")}>
      <Board
        fen={fen}
        orientation={flipped ? "black" : "white"}
        lastMove={last}
        shapes={shapes}
        quickMoves={quick}
        sounds={sounds}
        onMove={(m: BoardMove) => {
          setHistory((h) => [...h, m.san]);
          setLast([m.from, m.to]);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFlipped((f) => !f)}>
          {t("flip")}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setHistory([]);
            setLast(undefined);
          }}
        >
          <RotateCcw aria-hidden="true" />
          {t("reset")}
        </button>
        <Toggle label={t("quick")} on={quick} onChange={setQuick} />
        <Toggle label={t("sounds")} on={sounds} onChange={setSounds} />
        <Toggle label={t("arrows")} on={arrows} onChange={setArrows} />
      </div>
      {history.length > 0 && (
        <p className="text-sm text-fg-muted">
          <SanLine moves={history} />
        </p>
      )}
    </DemoCard>
  );
}

/** A required move: anything but e4 bounces back with a shake; after two mistakes the solution arrow appears. */
export function TaskDemo() {
  const t = useTranslations("devComponents.task");
  const [fen, setFen] = useState(START);
  const [last, setLast] = useState<[Square, Square] | undefined>();
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<"none" | "good" | "wrong">("none");

  const reset = () => {
    setFen(START);
    setLast(undefined);
    setMistakes(0);
    setResult("none");
  };

  return (
    <DemoCard title={t("title")} hint={t("hint")}>
      <div className="overflow-hidden rounded-md">
        <Board
          fen={fen}
          lastMove={last}
          interactive={result === "good" ? false : "white"}
          shapes={mistakes >= 2 && result !== "good" ? [{ from: "e2", to: "e4", tone: "hint" }] : []}
          onMove={(m) => {
            if (m.san !== "e4") {
              setMistakes((n) => n + 1);
              setResult("wrong");
              return false;
            }
            setFen(m.fenAfter);
            setLast([m.from, m.to]);
            setResult("good");
          }}
        />
        {result === "good" && (
          <FeedbackBanner kind="success" title={t("good")} message={t("goodMessage")}>
            <button type="button" className="btn btn-primary" onClick={reset}>
              <SkipForward aria-hidden="true" />
              {t("next")}
            </button>
            <button type="button" className="btn btn-secondary">
              <Share2 aria-hidden="true" />
            </button>
          </FeedbackBanner>
        )}
        {result === "wrong" && (
          <FeedbackBanner kind="error" title={t("wrong")} message={t("wrongMessage")}>
            <button type="button" className="btn btn-secondary" onClick={() => setResult("none")}>
              {t("retry")}
            </button>
          </FeedbackBanner>
        )}
      </div>
    </DemoCard>
  );
}

const PROMO_FEN = "4k3/1P6/8/8/8/8/8/4K3 w - - 0 1"; // verified: b8=Q/R/B/N all legal

export function PromotionDemo() {
  const t = useTranslations("devComponents.promo");
  const [fen, setFen] = useState(PROMO_FEN);
  const [last, setLast] = useState<[Square, Square] | undefined>();
  const [san, setSan] = useState<string | null>(null);
  return (
    <DemoCard title={t("title")} hint={t("hint")}>
      <Board
        fen={fen}
        lastMove={last}
        interactive={san ? false : "white"}
        onMove={(m) => {
          setFen(m.fenAfter);
          setLast([m.from, m.to]);
          setSan(m.san);
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">{san && <SanLine moves={[san]} />}</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFen(PROMO_FEN);
            setLast(undefined);
            setSan(null);
          }}
        >
          <RotateCcw aria-hidden="true" />
          {t("reset")}
        </button>
      </div>
    </DemoCard>
  );
}

const KNIGHT_FEN = "7k/8/8/8/3N4/8/8/K7 w - - 0 1";
const KNIGHT_TARGETS = new Set<Square>(["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"]); // verified with chess.js

/** "Tap every square the knight attacks" (lesson step type `squares`). */
export function SquaresDemo() {
  const t = useTranslations("devComponents.squares");
  const [marks, setMarks] = useState<Partial<Record<Square, SquareMark>>>({});
  const found = Object.values(marks).filter((m) => m === "marked-ok").length;
  return (
    <DemoCard title={t("title")} hint={t("hint")}>
      <Board
        fen={KNIGHT_FEN}
        interactive={false}
        marks={marks}
        sounds={false}
        onSquareTap={(sq) => {
          if (sq === "d4" || marks[sq] === "marked-ok") return;
          setMarks((m) => ({ ...m, [sq]: KNIGHT_TARGETS.has(sq) ? "marked-ok" : "marked-bad" }));
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold tabular">{t("found", { found, total: KNIGHT_TARGETS.size })}</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMarks({})}>
          <RotateCcw aria-hidden="true" />
          {t("reset")}
        </button>
      </div>
    </DemoCard>
  );
}

export function CoachDemo() {
  const t = useTranslations("devComponents.coach");
  const [run, setRun] = useState(0);
  return (
    <DemoCard title={t("title")}>
      <CoachBubble key={run} text={t("text")} />
      <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setRun((r) => r + 1)}>
        <RotateCcw aria-hidden="true" />
        {t("replay")}
      </button>
    </DemoCard>
  );
}
