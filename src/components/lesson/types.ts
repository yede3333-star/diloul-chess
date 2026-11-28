import type { Square } from "chess.js";
import type { BoardShape } from "@/components/board/Board";
import type { Bi } from "@/lib/openings/types";

/**
 * A lesson is a list of short steps, one screen each (SPEC §6.4).
 * Steps are plain data, so a server page can build them and pass them to the client player.
 */
export type LessonStep =
  /** Intro slide: a title and one or two sentences over an illustrative position. */
  | { kind: "slide"; fen: string; lastMove?: [Square, Square]; title: Bi; text: Bi; shapes?: BoardShape[] }
  /** A short explanation over the current position, then "Next". */
  | { kind: "info"; fen: string; lastMove?: [Square, Square]; text: Bi; shapes?: BoardShape[] }
  /**
   * Moves played by themselves from `fen` (back to the position where something new starts).
   * `auto`: go on by itself when done; otherwise wait for "Next" (start of a drill line).
   */
  | { kind: "replay"; fen: string; moves: string[]; text: Bi; auto: boolean }
  /**
   * The player must play one of `expect` (SAN). Then the opponent plays `reply` (SAN) by itself.
   * `hint` is shown after the first wrong move in practice; after two, the solution arrow appears.
   * `after`: why the move is played, shown once it is played; the lesson waits for "Next".
   */
  | {
      kind: "move";
      fen: string;
      lastMove?: [Square, Square];
      prompt: Bi;
      hint: Bi;
      expect: string[];
      reply?: string;
      after?: Bi;
    };

export type LessonScript = {
  id: string;
  /** "lesson": new moves; "drill": the same lines from memory. Changes the end screen. */
  kind: "lesson" | "drill";
  /**
   * "learn": the player sees the line for the first time, so the move is shown at once (arrow and
   * highlighted squares) and there is no hint button.
   * "practice" (drill, review): played from memory; a hint button, and the arrow after two mistakes.
   */
  mode: "learn" | "practice";
  title: Bi;
  orientation: "white" | "black";
  /** Position shown before the first step, so the first slide's pieces slide into place. */
  startFen?: string;
  steps: LessonStep[];
  /** New moves taught (lesson) or positions played from memory (drill), for the end screen. */
  count: number;
};
