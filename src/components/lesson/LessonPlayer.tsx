"use client";

import "./lesson.css";

import { Chess, type Square } from "chess.js";
import { BookOpen, Volume2, VolumeX, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Board, type BoardMove, type BoardShape, type SquareMark } from "@/components/board/Board";
import { CoachBubble, type CoachTone } from "@/components/coach/CoachBubble";
import { BackArrow } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import { playSound } from "@/lib/sound/sounds";
import { useSoundOn } from "@/lib/sound/useSoundOn";
import { LessonEnd } from "./LessonEnd";
import { starsFor } from "./stars";
import type { LessonScript, LessonStep } from "./types";

type View = { fen: string; lastMove?: [Square, Square] };
type Feedback = { tone: CoachTone; title: string; text?: string };
type Badge = { square: Square; ok: boolean; key: number };

/** Delay before the opponent answers a correct move, then before the next explanation. */
const REPLY_DELAY = 850;
const NEXT_DELAY = 600;
/** Time between two replayed moves. */
const REPLAY_STEP = 420;

const viewOf = (s: LessonStep): View => ({ fen: s.fen, lastMove: s.kind === "replay" ? undefined : s.lastMove });

function soundFor(game: Chess, captured: boolean) {
  playSound(game.inCheck() ? "check" : captured ? "capture" : "move");
}

/**
 * The lesson player (SPEC §6.4): one screen, never scrolls.
 * Top: close, thin progress bar, sound. Then the board, the mascot's bubble and one button,
 * kept together near the thumb.
 */
export function LessonPlayer({
  script,
  exitHref = "/learn/openings",
  nextHref,
  nextLabel,
  onComplete,
}: {
  script: LessonScript;
  exitHref?: string;
  /** Where "Next" leads on the end screen (default: exitHref). */
  nextHref?: string;
  nextLabel?: string;
  onComplete?: (result: { stars: number; mistakes: number }) => void;
}) {
  const t = useTranslations("lesson");
  const locale = useLocale() as "ar" | "fr";
  const router = useRouter();
  const steps = script.steps;
  const learn = script.mode === "learn";

  const [i, setI] = useState(0);
  const [view, setView] = useState<View>(() => (script.startFen ? { fen: script.startFen } : viewOf(steps[0])));
  const [busy, setBusy] = useState(false); // moves playing by themselves
  const [waitNext, setWaitNext] = useState(false); // a correct move's explanation is shown
  const [wrongHere, setWrongHere] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [sound, setSound] = useSoundOn();
  const [quit, setQuit] = useState(false);
  const [run, setRun] = useState(0);

  // Timers of the current step only: entering another step cancels them.
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const done = i >= steps.length;
  const step = done ? undefined : steps[i];

  // `enter` calls itself (an automatic replay goes on to the next step) through this ref.
  const enterRef = useRef<(n: number) => void>(() => {});
  const enter = useCallback(
    (n: number) => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setI(n);
      setBusy(false);
      setWaitNext(false);
      setWrongHere(0);
      setFeedback(null);
      setBadge(null);
      const s = steps[n];
      if (!s) return;
      setView(viewOf(s));
      if (s.kind !== "replay") return;
      // Replay: the moves play by themselves, one after the other.
      setBusy(true);
      const game = new Chess(s.fen);
      s.moves.forEach((san, k) => {
        later(
          () => {
            const m = game.move(san);
            setView({ fen: game.fen(), lastMove: [m.from, m.to] });
            soundFor(game, !!m.captured);
          },
          (k + 1) * REPLAY_STEP,
        );
      });
      later(
        () => {
          setBusy(false);
          if (s.auto) enterRef.current(n + 1);
        },
        (s.moves.length + 1) * REPLAY_STEP,
      );
    },
    [steps, later],
  );
  useEffect(() => {
    enterRef.current = enter;
  }, [enter]);

  // Start: the first slide's pieces slide in from the start position; a replay starts playing.
  // Only if the player is still on the first step (a fast tap on "Next" must not be undone).
  const iRef = useRef(i);
  useEffect(() => {
    iRef.current = i;
  }, [i]);
  useEffect(() => {
    const id = window.setTimeout(() => iRef.current === 0 && enter(0), script.startFen ? 450 : 30);
    return () => clearTimeout(id);
  }, [run, enter, script.startFen]);

  // Report the result once, when the end screen appears.
  const reported = useRef(false);
  useEffect(() => {
    if (!done || reported.current) return;
    reported.current = true;
    onComplete?.({ stars: starsFor(mistakes), mistakes });
  }, [done, mistakes, onComplete]);

  const restart = () => {
    clearTimers();
    reported.current = false;
    setMistakes(0);
    setI(0);
    setView(script.startFen ? { fen: script.startFen } : viewOf(steps[0]));
    setRun((r) => r + 1);
  };

  /** After a correct move: the opponent replies by itself, then the next step. */
  const continueAfter = (fenAfter: string, reply?: string) => {
    setBusy(true);
    setWaitNext(false);
    if (!reply) {
      later(() => enter(i + 1), NEXT_DELAY);
      return;
    }
    later(() => {
      const game = new Chess(fenAfter);
      const r = game.move(reply);
      setBadge(null);
      setView({ fen: game.fen(), lastMove: [r.from, r.to] });
      soundFor(game, !!r.captured);
      later(() => enter(i + 1), NEXT_DELAY);
    }, 250);
  };

  const onMove = (move: BoardMove) => {
    if (step?.kind !== "move" || busy || waitNext) return false;
    if (step.expect.includes(move.san)) {
      const praise = t(`praise${(1 + Math.floor(Math.random() * 3)) as 1 | 2 | 3}`);
      setView({ fen: move.fenAfter, lastMove: [move.from, move.to] });
      setBadge({ square: move.to, ok: true, key: Date.now() });
      later(() => playSound("success"), 160);
      if (step.after) {
        // An important move: say why, and wait for the player to read it.
        setFeedback({ tone: "success", title: praise, text: step.after[locale] });
        setWaitNext(true);
        return;
      }
      setFeedback({ tone: "success", title: praise });
      setBusy(true);
      later(() => continueAfter(move.fenAfter, step.reply), REPLY_DELAY - 250);
      return;
    }
    // Wrong: the board puts the piece back, shakes and buzzes; a ✗ marks the square tried.
    const n = wrongHere + 1;
    setWrongHere(n);
    setMistakes((m) => m + 1);
    const key = Date.now();
    setBadge({ square: move.to, ok: false, key });
    later(() => setBadge((b) => (b?.key === key ? null : b)), 900);
    setFeedback({ tone: "danger", title: t("wrongTitle"), text: learn || n >= 2 ? t("followArrow") : step.hint[locale] });
    return false;
  };

  const showHint = () => {
    if (step?.kind !== "move" || wrongHere >= 2) return;
    setWrongHere(2);
    setMistakes((m) => m + 1); // a hint counts like a mistake for the stars
    setFeedback({ tone: "hint", title: t("hintTitle"), text: t("followArrow") });
  };

  // The move to play: shown at once when learning; from memory in practice (arrow after two mistakes or a hint).
  let shapes: BoardShape[] = [];
  let marks: Partial<Record<Square, SquareMark>> | undefined;
  if (step && (step.kind === "slide" || step.kind === "info")) shapes = step.shapes ?? [];
  if (step?.kind === "move" && (learn || wrongHere >= 2) && !busy && !waitNext) {
    const m = new Chess(step.fen).move(step.expect[0]);
    shapes = [{ from: m.from, to: m.to, tone: "best" }];
    if (learn) marks = { [m.from]: "marked-soft", [m.to]: "marked-soft" };
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
    if (dx > 0) enter(i + 1);
    else if (i > 0 && steps[i - 1].kind === "slide") enter(i - 1);
  };

  const progress = done ? 1 : (i + (busy || waitNext ? 0.6 : 0)) / steps.length;
  const canGoBack = step?.kind === "slide" && i > 0;
  const isLastSlide = step?.kind === "slide" && steps[i + 1]?.kind !== "slide";

  // Bubble content: feedback first, otherwise the step's own text.
  const bubble: { title?: string; text: string; tone: CoachTone } | null = feedback
    ? { title: feedback.title, text: feedback.text ?? "", tone: feedback.tone }
    : step?.kind === "slide"
      ? { title: step.title[locale], text: step.text[locale], tone: "default" }
      : step?.kind === "move"
        ? { text: step.prompt[locale], tone: "default" }
        : step
          ? { text: step.text[locale], tone: "default" }
          : null;

  // One footer slot, always the same height, so nothing moves between steps.
  let footer: ReactNode;
  if (step?.kind === "move" && waitNext) {
    footer = (
      <button type="button" className="btn btn-primary btn-lg flex-1" onClick={() => continueAfter(view.fen, step.reply)}>
        {t("continue")}
      </button>
    );
  } else if (step?.kind === "move" && learn) {
    footer = <p className="flex min-h-14 flex-1 items-center justify-center text-center text-[15px] font-semibold text-fg-muted">{t("yourTurn")}</p>;
  } else if (step?.kind === "move") {
    footer = (
      <button type="button" className="btn btn-secondary btn-lg flex-1" disabled={busy || wrongHere >= 2} onClick={showHint}>
        {t("hint")}
      </button>
    );
  } else if (step?.kind === "replay" && step.auto) {
    footer = <p className="min-h-14 flex-1" aria-hidden="true" />;
  } else {
    footer = (
      <button type="button" className="btn btn-primary btn-lg flex-1" disabled={busy} onClick={() => enter(i + 1)}>
        {isLastSlide ? t("start") : t("next")}
      </button>
    );
  }

  const exit = () => router.push(exitHref);

  return (
    <div
      className="lesson fixed inset-0 flex flex-col overflow-hidden bg-bg"
      // For tests: whose turn it is ("move" = the board waits for the player).
      data-step={i}
      data-phase={done ? "end" : busy ? "busy" : waitNext ? "read" : step?.kind}
    >
      <header className="flex h-14 shrink-0 items-center gap-1 px-1.5">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label={t("close")}
          onClick={() => (i > 0 && !done ? setQuit(true) : exit())}
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
          onClick={() => setSound(!sound)}
        >
          {sound ? <Volume2 className="size-6" aria-hidden="true" /> : <VolumeX className="size-6" aria-hidden="true" />}
        </button>
      </header>

      {done ? (
        <LessonEnd
          title={script.title[locale]}
          kind={script.kind}
          count={script.count}
          mistakes={mistakes}
          nextLabel={nextLabel ?? t("continue")}
          onRetry={restart}
          onNext={() => router.push(nextHref ?? exitHref)}
        />
      ) : (
        <>
          {/* Board, bubble and button stay together at the bottom, within thumb reach. Spare height on tall
              screens goes above the board; on short screens the board shrinks (square: min(width, height)). */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="lesson-spare-top px-4">
              <p className="lesson-topic flex items-center gap-2 pt-1 font-heading font-bold text-fg-muted">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                  <BookOpen className="size-4" aria-hidden="true" />
                </span>
                <span className="truncate">{script.title[locale]}</span>
              </p>
            </div>
            <div className="lesson-stage relative min-h-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
              <div className="absolute inset-0 grid place-items-center">
                <div className="lesson-board relative">
                  <Board
                    fen={view.fen}
                    lastMove={view.lastMove}
                    orientation={script.orientation}
                    interactive={step?.kind === "move" && !busy && !waitNext ? script.orientation : false}
                    onMove={onMove}
                    shapes={shapes}
                    marks={marks}
                    sounds={sound}
                    animationMs={320}
                  />
                  {badge && <SquareBadge key={badge.key} square={badge.square} ok={badge.ok} orientation={script.orientation} />}
                </div>
              </div>
            </div>

            <div className="lesson-coach flex shrink-0 flex-col px-4 pt-3">
              {bubble && (
                <CoachBubble
                  key={`${i}-${feedback?.title ?? ""}-${feedback?.text ?? ""}`}
                  title={bubble.title}
                  text={bubble.text}
                  tone={bubble.tone}
                  mascotSize={44}
                  compact={bubble.text.length + (bubble.title?.length ?? 0) > (locale === "ar" ? 120 : 150)}
                />
              )}
            </div>
            <div className="lesson-spare-bottom" />
          </div>

          <footer className="flex shrink-0 gap-3 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            {canGoBack && (
              <button type="button" className="btn btn-secondary btn-lg w-14 shrink-0 !px-0" aria-label={t("back")} onClick={() => enter(i - 1)}>
                <BackArrow />
              </button>
            )}
            {footer}
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
            <button type="button" className="btn btn-ghost" onClick={exit}>
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
    <span aria-hidden="true" className={`lesson-badge ${ok ? "bg-success" : "bg-danger"}`} style={{ left: `${(col + 1) * 12.5}%`, top: `${row * 12.5}%` }}>
      {ok ? "✓" : "✗"}
    </span>
  );
}
