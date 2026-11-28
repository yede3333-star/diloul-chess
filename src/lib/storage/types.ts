/**
 * The player's data, as one snapshot. The same shape is stored in the browser for guests
 * (IndexedDB) and in Supabase for signed-in players (SPEC §13.1).
 */
import type { BoardTheme, Theme } from "@/lib/prefs/prefs";

export type Area = "openings" | "endgames" | "puzzles";
export const AREAS: Area[] = ["openings", "endgames", "puzzles"];

export type OnboardingLevel = "none" | "rules" | "r800" | "r1200" | "r1600";
export const ONBOARDING_LEVELS: OnboardingLevel[] = ["none", "rules", "r800", "r1200", "r1600"];

export type Settings = {
  theme?: Theme;
  board?: BoardTheme;
  quickMoves?: boolean;
  sounds?: boolean;
  animatedText?: boolean;
};

export type LinkedAccounts = { chesscom?: string; lichess?: string };

export type Profile = {
  locale?: "ar" | "fr";
  timezone?: string;
  onboardingLevel?: OnboardingLevel;
  /** ISO date-time; set when onboarding is finished. */
  onboardedAt?: string;
  /** First unlocked chapter in Basics (1–9). */
  basicsChapter?: number;
  settings: Settings;
  linked: LinkedAccounts;
  /** ISO date-time of the last local change, used to pick the newer settings when merging. */
  updatedAt: string;
};

/** A completed path node. course: "basics", "opening:{id}", "endgame". */
export type NodeProgress = { course: string; nodeId: string; stars: number; completedAt: string };

export type SrsCard = {
  id: string;
  kind: "opening" | "mistake";
  ref: string;
  fen: string;
  answerUci: string;
  fsrs: Record<string, unknown>;
  due: string;
  lastReview?: string;
};

export type PuzzleStats = { rating: number; rd: number; vol: number; solved: number; streakBest: number };

export type Snapshot = {
  version: 1;
  profile: Profile | null;
  ranks: Partial<Record<Area, number>>;
  progress: NodeProgress[];
  cards: SrsCard[];
  puzzles: PuzzleStats | null;
  /** Actions per day, keyed "YYYY-MM-DD" in the player's time zone. */
  activity: Record<string, number>;
};

/** A change to apply. Every part is optional; lists are upserted, never replaced. */
export type Patch = {
  profile?: Partial<Omit<Profile, "settings" | "linked">> & { settings?: Settings; linked?: LinkedAccounts };
  ranks?: Partial<Record<Area, number>>;
  progress?: NodeProgress[];
  cards?: SrsCard[];
  puzzles?: PuzzleStats;
  /** Actions to ADD to a day. */
  activity?: Record<string, number>;
};

export function emptySnapshot(): Snapshot {
  return { version: 1, profile: null, ranks: {}, progress: [], cards: [], puzzles: null, activity: {} };
}

/** True when a guest has stored anything worth moving to an account. */
export function hasData(s: Snapshot): boolean {
  return (
    !!s.profile?.onboardedAt ||
    Object.keys(s.ranks).length > 0 ||
    s.progress.length > 0 ||
    s.cards.length > 0 ||
    !!s.puzzles ||
    Object.keys(s.activity).length > 0
  );
}

/** Where the data lives: the browser (guest) or Supabase (signed-in player). */
export interface StorageAdapter {
  readonly kind: "local" | "remote";
  load(): Promise<Snapshot>;
  /** Persist the given final values (already merged by the caller). */
  write(values: Snapshot, changed: Patch): Promise<void>;
  /** Write a whole snapshot (guest → account migration). Never deletes existing rows. */
  writeAll(values: Snapshot): Promise<void>;
  clear(): Promise<void>;
}
