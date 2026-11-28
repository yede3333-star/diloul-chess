"use client";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.cburnett.css";
import "./board.css";

import { Chess, type Square } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Config } from "chessground/config";
import type { DrawShape } from "chessground/draw";
import type { Key } from "chessground/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPromotion, legalDests, turnColor, type Color } from "@/lib/chess/legal";
import { buzz, playSound } from "@/lib/sound/sounds";

export type PromotionPiece = "q" | "r" | "b" | "n";

export type BoardMove = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  captured: boolean;
  check: boolean;
};

export type BoardShape = {
  from: Square;
  /** Without `to`, a circle is drawn on `from`. */
  to?: Square;
  tone?: "best" | "alt" | "danger" | "hint";
};

export type SquareMark = "marked" | "marked-ok" | "marked-bad";

type Props = {
  /** The position shown. The board is controlled: after an accepted move, pass the new FEN. */
  fen: string;
  orientation?: Color;
  /**
   * Who may move: `true` = the side to move, a color = only that color, `false` = view only.
   * Only legal moves are allowed.
   */
  interactive?: boolean | Color;
  /**
   * Called after the player makes a legal move (after choosing a promotion piece).
   * Return `false` to reject it: the piece goes back, the board shakes and the phone vibrates.
   */
  onMove?: (move: BoardMove) => boolean | void;
  /** Called when a square is tapped (lesson steps like "tap every square the knight attacks"). */
  onSquareTap?: (square: Square) => void;
  lastMove?: [Square, Square];
  shapes?: BoardShape[];
  marks?: Partial<Record<Square, SquareMark>>;
  coordinates?: boolean;
  /** "Quick moves" setting: no piece animation. */
  quickMoves?: boolean;
  /** Piece slide duration in ms (lessons use a slower, smoother slide). */
  animationMs?: number;
  sounds?: boolean;
  /** Accessible name, e.g. the position or the task. */
  label?: string;
  className?: string;
};

const TONE_BRUSH: Record<NonNullable<BoardShape["tone"]>, string> = {
  best: "green",
  alt: "blue",
  danger: "red",
  hint: "yellow",
};

// Lichess order, starting on the promotion square: queen, knight, rook, bishop.
const PROMO_ROLES: { p: PromotionPiece; role: "queen" | "knight" | "rook" | "bishop" }[] = [
  { p: "q", role: "queen" },
  { p: "n", role: "knight" },
  { p: "r", role: "rook" },
  { p: "b", role: "bishop" },
];

/** Brush colors come from the design tokens, read from the board element (follows theme and board theme). */
function brushes(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    green: { key: "g", color: v("--board-arrow", "#2f9e86"), opacity: 0.9, lineWidth: 10 },
    blue: { key: "b", color: v("--board-arrow-alt", "#4a74c9"), opacity: 0.6, lineWidth: 9 },
    red: { key: "r", color: v("--danger", "#ef7468"), opacity: 0.85, lineWidth: 10 },
    yellow: { key: "y", color: v("--warning", "#f0c45c"), opacity: 0.85, lineWidth: 10 },
    paleBlue: { key: "pb", color: "#003088", opacity: 0.4, lineWidth: 15 },
    paleGreen: { key: "pg", color: "#15781B", opacity: 0.4, lineWidth: 15 },
    paleRed: { key: "pr", color: "#882020", opacity: 0.4, lineWidth: 15 },
    paleGrey: { key: "pgr", color: "#4a4a4a", opacity: 0.35, lineWidth: 15 },
    purple: { key: "purple", color: "#68217a", opacity: 0.65, lineWidth: 10 },
    pink: { key: "pink", color: "#ee2080", opacity: 0.5, lineWidth: 10 },
    white: { key: "white", color: "white", opacity: 1, lineWidth: 10 },
  };
}

/**
 * The interactive board (SPEC §4.4): Chessground with chess.js rules.
 * Drag or tap to move, legal moves only, arrows and circles, last move and check highlights,
 * flip via `orientation`, promotion picker, sounds, quick-moves mode, and a shake on rejected moves.
 */
export function Board({
  fen,
  orientation = "white",
  interactive = true,
  onMove,
  onSquareTap,
  lastMove,
  shapes = [],
  marks,
  coordinates = true,
  quickMoves = false,
  animationMs = 200,
  sounds = true,
  label,
  className = "",
}: Props) {
  const t = useTranslations("components.board");
  const rootRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square; color: Color } | null>(null);
  const [wrong, setWrong] = useState(0);

  const chess = useMemo(() => new Chess(fen), [fen]);

  // Latest values for Chessground's event callbacks, which are bound once.
  const latest = useRef({ fen, onMove, onSquareTap, sounds });
  useEffect(() => {
    latest.current = { fen, onMove, onSquareTap, sounds };
  });

  const movableColor: Color | undefined =
    interactive === false ? undefined : interactive === true ? turnColor(chess) : interactive;

  const buildConfig = useCallback((): Config => {
    const custom = new Map<Key, string>();
    if (marks) for (const [sq, cls] of Object.entries(marks)) if (cls) custom.set(sq as Key, cls);
    return {
      fen,
      orientation,
      turnColor: turnColor(chess),
      check: chess.inCheck() ? turnColor(chess) : false,
      lastMove: lastMove as Key[] | undefined,
      coordinates,
      animation: { enabled: !quickMoves, duration: animationMs },
      highlight: { lastMove: true, check: true, custom },
      movable: {
        free: false,
        color: movableColor,
        dests: movableColor ? (legalDests(chess) as Map<Key, Key[]>) : new Map(),
        showDests: true,
      },
      premovable: { enabled: false },
      draggable: { enabled: !!movableColor, showGhost: true },
      selectable: { enabled: true },
    };
  }, [fen, orientation, chess, lastMove, coordinates, quickMoves, animationMs, movableColor, marks]);

  // Latest full config, so a rejected move can restore the position *and* the legal moves
  // (Chessground clears its legal-move list after every move).
  const configRef = useRef(buildConfig);
  useEffect(() => {
    configRef.current = buildConfig;
  });

  /** Puts the pieces back to the current position without any error feedback. */
  const reset = useCallback(() => {
    apiRef.current?.set(configRef.current());
  }, []);

  const cancelPromotion = useCallback(() => {
    setPromo(null);
    reset();
  }, [reset]);

  useEffect(() => {
    if (!promo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancelPromotion();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [promo, cancelPromotion]);

  const revert = useCallback(() => {
    const { sounds: snd } = latest.current;
    apiRef.current?.set(configRef.current());
    setWrong((n) => n + 1);
    buzz();
    if (snd) playSound("error");
  }, []);

  const finishMove = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      const { fen: before, onMove: cb, sounds: snd } = latest.current;
      const game = new Chess(before);
      let result;
      try {
        result = game.move({ from, to, promotion });
      } catch {
        revert();
        return;
      }
      const move: BoardMove = {
        from,
        to,
        promotion,
        san: result.san,
        uci: `${from}${to}${promotion ?? ""}`,
        fenBefore: before,
        fenAfter: game.fen(),
        captured: !!result.captured,
        check: game.inCheck(),
      };
      if (cb?.(move) === false) {
        revert();
        return;
      }
      if (snd) playSound(promotion ? "promote" : move.check ? "check" : move.captured ? "capture" : "move");
    },
    [revert],
  );

  // Create Chessground once.
  useEffect(() => {
    if (!cgRef.current) return;
    const api = Chessground(cgRef.current, {
      ...buildConfig(),
      drawable: { enabled: true, visible: true, brushes: brushes(cgRef.current) },
      events: {
        select: (key) => latest.current.onSquareTap?.(key as Square),
      },
      movable: {
        ...buildConfig().movable,
        events: {
          after: (orig, dest) => {
            const game = new Chess(latest.current.fen);
            if (isPromotion(game, orig as Square, dest as Square)) {
              setPromo({ from: orig as Square, to: dest as Square, color: turnColor(game) });
            } else {
              finishMove(orig as Square, dest as Square);
            }
          },
        },
      },
    });
    apiRef.current = api;

    // Chessground caches the board's screen position and refreshes it only on scroll/resize.
    // If content above the board changes height (fonts loading, a banner appearing), taps land on
    // the wrong square. Refresh the cache at the start of every press, before Chessground reads it.
    const root = rootRef.current;
    const clearBounds = () => api.state.dom.bounds.clear();
    root?.addEventListener("mousedown", clearBounds, { capture: true });
    root?.addEventListener("touchstart", clearBounds, { capture: true, passive: true });

    return () => {
      root?.removeEventListener("mousedown", clearBounds, { capture: true });
      root?.removeEventListener("touchstart", clearBounds, { capture: true });
      api.destroy();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; later changes go through api.set below
  }, []);

  // Sync position and options.
  useEffect(() => {
    apiRef.current?.set(buildConfig());
  }, [buildConfig]);

  // Sync arrows and circles.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !cgRef.current) return;
    api.state.drawable.brushes = brushes(cgRef.current);
    const drawn: DrawShape[] = shapes.map((s) => ({
      orig: s.from as Key,
      dest: s.to as Key | undefined,
      brush: TONE_BRUSH[s.tone ?? "best"],
    }));
    api.setAutoShapes(drawn);
  }, [shapes]);

  // Remove the shake class after the animation so it can replay.
  useEffect(() => {
    if (!wrong) return;
    const id = window.setTimeout(() => rootRef.current?.classList.remove("is-wrong"), 320);
    rootRef.current?.classList.add("is-wrong");
    return () => window.clearTimeout(id);
  }, [wrong]);

  return (
    <div ref={rootRef} className={`dboard ${className}`} role="group" aria-label={label ?? t("label")}>
      <div ref={cgRef} />
      {promo && (
        <div
          className="promo"
          role="dialog"
          aria-modal="true"
          aria-label={t("promoteTitle")}
          onClick={(e) => e.target === e.currentTarget && cancelPromotion()}
        >
          {(() => {
            // Column over the promotion square, growing away from the board edge.
            const file = promo.to.charCodeAt(0) - 97;
            const rank = Number(promo.to[1]) - 1;
            const col = orientation === "white" ? file : 7 - file;
            const atTop = (orientation === "white" ? 7 - rank : rank) === 0;
            return (
              <div className={`promo-col ${atTop ? "at-top" : "at-bottom"}`} style={{ left: `${col * 12.5}%` }}>
                {PROMO_ROLES.map(({ p, role }) => (
                  <button
                    key={p}
                    type="button"
                    className="promo-btn cg-wrap"
                    aria-label={t(`pieces.${role}`)}
                    onClick={() => {
                      const { from, to } = promo;
                      setPromo(null);
                      finishMove(from, to, p);
                    }}
                  >
                    <piece className={`${role} ${promo.color}`} />
                  </button>
                ))}
              </div>
            );
          })()}
          <button type="button" className="sr-only" onClick={cancelPromotion}>
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
