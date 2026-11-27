import type { Area, OnboardingLevel, PuzzleStats } from "@/lib/storage/types";

/**
 * What the onboarding level choice unlocks (SPEC §5.4).
 * Ranks are indexes into RANK_KEYS (0 = start … 6 = master). Edit freely: one place only.
 * The "this is too easy for me" button (later phases) lets anyone skip ahead with a short test.
 */
export type LevelStart = {
  ranks: Record<Area, number>;
  /** Initial Glicko-2 puzzle rating (rd high: the first puzzles move it quickly). */
  puzzleRating: number;
  /** First open chapter in Basics (1 = rules … 9 = calculation). */
  basicsChapter: number;
};

export const LEVEL_START: Record<OnboardingLevel, LevelStart> = {
  // "I don't know the rules": everything from the beginning.
  none: { ranks: { openings: 0, endgames: 0, puzzles: 0 }, puzzleRating: 400, basicsChapter: 1 },
  // "I know the rules": skip chapter 1 (rules), start with basic mates.
  rules: { ranks: { openings: 0, endgames: 0, puzzles: 0 }, puzzleRating: 600, basicsChapter: 2 },
  // ~800: material and first tactics.
  r800: { ranks: { openings: 1, endgames: 0, puzzles: 1 }, puzzleRating: 800, basicsChapter: 3 },
  // ~1200: tactics I.
  r1200: { ranks: { openings: 1, endgames: 1, puzzles: 2 }, puzzleRating: 1200, basicsChapter: 4 },
  // 1600+: opening principles onward.
  r1600: { ranks: { openings: 2, endgames: 2, puzzles: 3 }, puzzleRating: 1600, basicsChapter: 6 },
};

export function initialPuzzleStats(level: OnboardingLevel): PuzzleStats {
  return { rating: LEVEL_START[level].puzzleRating, rd: 350, vol: 0.06, solved: 0, streakBest: 0 };
}
