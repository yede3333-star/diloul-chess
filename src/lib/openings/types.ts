/** Opening tree data (SPEC §7.4), as written by scripts/build-openings.mts. */
import type { RankKey } from "@/config/rank-keys";

export type Bi = { ar: string; fr: string };

export type OpeningNode = {
  fen: string;
  san: string;
  uci: string;
  ply: number;
  side: "user" | "opponent";
  freq?: number;
  games?: number;
  /** Centipawns, White's point of view, after the move. */
  eval?: number;
  /** Player moves: centipawns lost vs the engine's best move. */
  loss?: number;
  tier: RankKey;
  name?: Bi;
  note?: Bi;
  tags?: string[];
  eco?: string;
  children: OpeningNode[];
};

export type OpeningTree = {
  id: string;
  color: "white" | "black";
  root: string[];
  builtAt: string;
  source: { explorer: string; speeds: string; depth: number; upTo: RankKey };
  /** Intro slides of the first lesson: a position (moves from the start), marks like "f3e5:best" or "d4". */
  intro?: { title: Bi; text: Bi; moves: string; shapes?: string[] }[];
  idea?: Bi;
  plans?: Bi[];
  mistakes?: Bi[];
  children: OpeningNode[];
};

/** Position identity without move counters (transpositions share it). */
export const fenKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");
