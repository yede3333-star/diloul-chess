"use client";

import "./lesson.css";

import { Chess, type Square } from "chess.js";
import { Volume2, VolumeX, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Board, type BoardMove, type BoardShape } from "@/components/board/Board";
import { CoachBubble, type CoachTone } from "@/components/coach/CoachBubble";
import { BackArrow } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import { playSound } from "@/lib/sound/sounds";
import { LessonEnd } from "./LessonEnd";
import type { LessonScript, LessonStep } from "./types";

type View = { fen: string; lastMove?: [Square, Square] };
type Feedback = { tone: CoachTone; title: string; text?: string };
type Badge = { square: Square; ok: boolean; key: number };

/** Delay before the opponent answers a correct move, then before the next explanation. */
const REPLY_DELAY = 850;
const NEXT_DELAY = 600;

const viewOf = (s: LessonStep): View => ({ fen: s.fen, lastMove: s.lastMove });

/**
 * The lesson player (SPEC §6.4): one screen, never scrolls.
 * Top: close, thin progress bar, sound. Middle: the board, as large as fits.
 * Bottom: the mascot's bubble (one or two sentences) and one big button.
 */
export function LessonPlayer({ script, exitHref = "/learn/openings" }: { script: LessonScript; exitHref?: string }) {
  const t = useTranslations("lesson");
  const locale = useLocale() as "ar" | "fr";
  const router = useRouter();
  const steps = script.steps;

  const [i, setI] = useState(0);
  const [view, setView] = useState<View>(() => (script.startFen ? { fen: script.startFen } : viewOf(steps[0])));
  const [busy, setBusy] = useState(false); // between a correct move and the next step
  const [wrongHere, setWrongHere] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [sound, setSound] = useState(true);
  const [quit, setQuit] = useState(false);
  const [run, setRun] = useState(0);

  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // First slide: the pieces slide from the start position into the opening's setup.
  useEffect(() => {
    if (!script.startFen) return;
    const id = window.setTimeout(() => setView(viewOf(steps[0])), 450);
    return () => clearTimeout(id);
  }, [run, script.startFen, steps]);

  const done = i >= steps.length;
  const step = done ? undefined : steps[i];

  const goTo = useCallback(
    (n: number) => {
      setI(n);
      setBusy(false);
      setWrongHere(0);
      setFeedback(null);
      setBadge(null);
      if (n < steps.length) setView(viewOf(steps[n]));
    },
    [steps],
  );

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMistakes(0);
    setView(script.startFen ? { fen: script.startFen } : viewOf(steps[0]));
    goTo(0);
    setRun((r) => r + 1);
  };

  const onMove = (move: BoardMove) => {
    if (step?.kind !== "move" || busy) return false;
    if (step.expect.includes(move.san)) {
      const praise = t(`praise${(1 + Math.floor(Math.random() * 3)) as 1 | 2 | 3}`);
      setBusy(true);
      setView({ fen: move.fenAfter, lastMove: [move.from, move.to] });
      setBadge({ square: move.to, ok: true, key: Date.now() });
      setFeedback({ tone: "success", title: praise });
      if (sound) later(() => playSound("success"), 160);
      const reply = step.reply;
      if (!reply) {
        later(() => goTo(i + 1), REPLY_DELAY);
        return;
      }
      later(() => {
        const game = new Chess(move.fenAfter);
        const r = game.move(reply);
        setBadge(null);
        setView({ fen: game.fen(), lastMove: [r.from, r.to] });
        if (sound) playSound(game.inCheck() ? "check" : r.captured ? "capture" : "move");
        later(() => goTo(i + 1), NEXT_DELAY);
      }, REPLY_DELAY);
      return;
    }
    // Wrong: the board puts the piece back, shakes and buzzes; a ✗ marks the square tried.
    const n = wrongHere + 1;
    setWrongHere(n);
    setMistakes((m) => m + 1);
    const key = Date.now();
    setBadge({ square: move.to, ok: false, key });
    later(() => setBadge((b) => (b?.key === key ? null : b)), 900);
    setFeedback({
      tone: "danger",
      title: t("wrongTitle"),
      text: n >= 2 ? t("followArrow") : step.hint[locale],
    });
    return false;
  };

  const showHint = () => {
    if (step?.kind !== "move" || wrongHere >= 2) return;
    setWrongHere(2);
    setMistakes((m) => m + 1); // a hint counts like a mistake for the stars
    setFeedback({
      tone: "hint",
      title: t("hintTitle"),
      text: t("followArrow"),
    });
  };

  // Solution arrow after two mistakes (or a hint).
  let shapes: BoardShape[] = [];
  if (step && step.kind !== "move") shapes = step.shapes ?? [];
  if (step?.kind === "move" && wrongHere >= 2 && !busy) {
    const m = new Chess(step.fen).move(step.expect[0]);
    shapes = [{ from: m.from, to: m.to, tone: "best" }];
  }

  // Slides can be flipped with a swipe (mirrored in RTL).
  const swipe = useRef<number | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = step?.kind === "slide" ? e.clientX : null;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipe.current === null) return;
    const dx = (e.clientX - swipe.current) * (locale === "ar" ? 1 : -1);
    swipe.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goTo(i + 1);
    else if (i > 0 && steps[i - 1].kind === "slide") goTo(i - 1);
  };

  const progress = done ? 1 : (i + (busy ? 0.6 : 0)) / steps.length;
  const canGoBack = step?.kind === "slide" && i > 0;
  const isLastSlide = step?.kind === "slide" && steps[i + 1]?.kind !== "slide";

  // Bubble content: feedback first, otherwise the step's own text.
  const bubble = feedback
    ? { title: feedback.title, text: feedback.text ?? "", tone: feedback.tone }
    : step?.kind === "slide"
      ? {
          title: step.title[locale],
          text: step.text[locale],
          tone: "default" as const,
        }
      : step?.kind === "info"
        ? {
            title: undefined,
            text: step.text[locale],
            tone: "default" as const,
          }
        : step?.kind === "move"
          ? {
              title: undefined,
              text: step.prompt[locale],
              tone: "default" as const,
            }
          : null;

  return (
    <div className="lesson fixed inset-0 flex flex-col overflow-hidden bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-1 px-1.5">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label={t("close")}
          onClick={() => (i > 0 && !done ? setQuit(true) : router.push(exitHref))}
        >
          <X className="size-6" strokeWidth={2.5} aria-hidden="true" />
        </button>
        <div
          role="progressbar"
          aria-label={t("progress")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3"
        >
          <div className="lesson-progress h-full rounded-full bg-accent" style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label={sound ? t("soundOn") : t("soundOff")}
          aria-pressed={sound}
          onClick={() => setSound((s) => !s)}
        >
          {sound ? <Volume2 className="size-6" aria-hidden="true" /> : <VolumeX className="size-6" aria-hidden="true" />}
        </button>
      </header>

      {done ? (
        <LessonEnd
          title={script.title[locale]}
          newMoves={steps.filter((s) => s.kind === "move").length}
          mistakes={mistakes}
          onRetry={restart}
          onNext={() => router.push(exitHref)}
          sound={sound}
        />
      ) : (
        <>
          {/* Board right under the bar, bubble right under the board; spare height goes above the button.
              On short screens the board shrinks instead (square: min(width, height)). */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="lesson-stage relative min-h-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
              <div className="absolute inset-0 grid place-items-center">
                <div className="lesson-board relative">
                  <Board
                    fen={view.fen}
                    lastMove={view.lastMove}
                    orientation={script.orientation}
                    interactive={step?.kind === "move" && !busy ? script.orientation : false}
                    onMove={onMove}
                    shapes={shapes}
                    sounds={sound}
                    animationMs={320}
                  />
                  {badge && <SquareBadge key={badge.key} square={badge.square} ok={badge.ok} orientation={script.orientation} />}
                </div>
              </div>
            </div>

            <div className="flex h-[128px] shrink-0 flex-col px-4 pt-3">
              {bubble && (
                <CoachBubble
                  key={`${i}-${feedback?.title ?? ""}-${feedback?.text ?? ""}`}
                  title={bubble.title}
                  text={bubble.text}
                  tone={bubble.tone}
                  mascotSize={48}
                />
              )}
            </div>
          </div>

          <footer className="flex shrink-0 gap-3 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            {canGoBack && (
              <button type="button" className="btn btn-secondary btn-lg !px-0 w-14 shrink-0" aria-label={t("back")} onClick={() => goTo(i - 1)}>
                <BackArrow />
              </button>
            )}
            {step?.kind === "move" ? (
              <button type="button" className="btn btn-secondary btn-lg flex-1" disabled={busy || wrongHere >= 2} onClick={showHint}>
                {t("hint")}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg flex-1" onClick={() => goTo(i + 1)}>
                {isLastSlide ? t("start") : t("next")}
              </button>
            )}
          </footer>
        </>
      )}

      {quit && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-overlay" onClick={(e) => e.target === e.currentTarget && setQuit(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            className="lesson-sheet flex flex-col gap-3 rounded-t-card bg-surface px-4 pt-5 pb-[max(16px,env(safe-area-inset-bottom))]"
          >
            <p id="quit-title" className="font-heading text-xl font-extrabold">
              {t("quitTitle")}
            </p>
            <p className="text-fg-muted">{t("quitText")}</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setQuit(false)} autoFocus>
              {t("quitStay")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.push(exitHref)}>
              {t("quitLeave")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A ✓ / ✗ disc in the corner of a square, above the piece. */
function SquareBadge({ square, ok, orientation }: { square: Square; ok: boolean; orientation: "white" | "black" }) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return (
    <span
      aria-hidden="true"
      className={`lesson-badge ${ok ? "bg-success" : "bg-danger"}`}
      style={{ left: `${(col + 1) * 12.5}%`, top: `${row * 12.5}%` }}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}
