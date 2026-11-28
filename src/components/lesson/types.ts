import type { Square } from "chess.js";
import type { BoardShape } from "@/components/board/Board";
import type { Bi } from "@/lib/openings/types";

/**
 * A lesson is a list of short steps, one screen each (SPEC §6.4).
 * Steps are plain data, so a server page can build them and pass them to the client player.
 */
export type LessonStep =
  /** Intro slide: a title and one or two sentences over an illustrative position. */
  | {
      kind: "slide";
      fen: string;
      lastMove?: [Square, Square];
      title: Bi;
      text: Bi;
      shapes?: BoardShape[];
    }
  /** A short explanation over the current position, then "Next". */
  | {
      kind: "info";
      fen: string;
      lastMove?: [Square, Square];
      text: Bi;
      shapes?: BoardShape[];
    }
  /**
   * The player must play one of `expect` (SAN). Then the opponent plays `reply` (SAN) by itself.
   * `hint` is shown after the first wrong move; after two, the solution arrow appears.
   */
  | {
      kind: "move";
      fen: string;
      lastMove?: [Square, Square];
      prompt: Bi;
      hint: Bi;
      expect: string[];
      reply?: string;
    };

export type LessonScript = {
  id: string;
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
};
