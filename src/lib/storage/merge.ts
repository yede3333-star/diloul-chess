import type { NodeProgress, Patch, Profile, PuzzleStats, Snapshot, SrsCard } from "./types";

/*
 * Pure merge rules (SPEC §13.1): when a guest signs in to an account that already has progress,
 * keep the higher value of every item and delete nothing.
 */

const earlier = (a?: string, b?: string) => (!a ? b : !b ? a : a < b ? a : b);

export function mergeProfile(a: Profile | null, b: Profile | null): Profile | null {
  if (!a) return b;
  if (!b) return a;
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a];
  return {
    // Simple fields and settings: the most recent change wins; never lose a value.
    locale: newer.locale ?? older.locale,
    timezone: newer.timezone ?? older.timezone,
    onboardingLevel: newer.onboardingLevel ?? older.onboardingLevel,
    onboardedAt: earlier(a.onboardedAt, b.onboardedAt),
    basicsChapter: Math.max(a.basicsChapter ?? 0, b.basicsChapter ?? 0) || undefined,
    settings: { ...older.settings, ...newer.settings },
    linked: { ...older.linked, ...newer.linked },
    updatedAt: newer.updatedAt,
  };
}

function mergeNode(a: NodeProgress, b: NodeProgress): NodeProgress {
  return {
    course: a.course,
    nodeId: a.nodeId,
    stars: Math.max(a.stars, b.stars),
    completedAt: earlier(a.completedAt, b.completedAt)!,
  };
}

/** The card reviewed more recently carries the more advanced schedule. */
function mergeCard(a: SrsCard, b: SrsCard): SrsCard {
  const la = a.lastReview ?? "";
  const lb = b.lastReview ?? "";
  return lb > la ? b : a;
}

export function mergePuzzles(a: PuzzleStats | null, b: PuzzleStats | null): PuzzleStats | null {
  if (!a) return b;
  if (!b) return a;
  const best = a.rating >= b.rating ? a : b;
  return {
    rating: best.rating,
    rd: best.rd,
    vol: best.vol,
    solved: Math.max(a.solved, b.solved),
    streakBest: Math.max(a.streakBest, b.streakBest),
  };
}

const nodeKey = (n: NodeProgress) => `${n.course}\u0000${n.nodeId}`;

function mergeList<T>(a: T[], b: T[], key: (x: T) => string, merge: (x: T, y: T) => T): T[] {
  const map = new Map<string, T>();
  for (const x of a) map.set(key(x), x);
  for (const y of b) {
    const k = key(y);
    const x = map.get(k);
    map.set(k, x ? merge(x, y) : y);
  }
  return [...map.values()];
}

/** Merge two snapshots (e.g. account + guest). Commutative for every rule except equal-time ties. */
export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const ranks: Snapshot["ranks"] = { ...a.ranks };
  for (const [area, r] of Object.entries(b.ranks) as [keyof Snapshot["ranks"], number][]) {
    ranks[area] = Math.max(ranks[area] ?? 0, r);
  }
  const activity: Record<string, number> = { ...a.activity };
  for (const [day, n] of Object.entries(b.activity)) activity[day] = Math.max(activity[day] ?? 0, n);

  return {
    version: 1,
    profile: mergeProfile(a.profile, b.profile),
    ranks,
    progress: mergeList(a.progress, b.progress, nodeKey, mergeNode),
    cards: mergeList(a.cards, b.cards, (c) => c.id, mergeCard),
    puzzles: mergePuzzles(a.puzzles, b.puzzles),
    activity,
  };
}

/**
 * Apply a change made on this device. Progress never goes backwards (stars and ranks keep the max),
 * cards are replaced by id (a review moves the schedule), activity counts are added.
 */
export function applyPatch(s: Snapshot, patch: Patch, now = new Date().toISOString()): Snapshot {
  const next: Snapshot = { ...s };
  if (patch.profile) {
    const prev = s.profile ?? { settings: {}, linked: {}, updatedAt: now };
    next.profile = {
      ...prev,
      ...patch.profile,
      settings: { ...prev.settings, ...patch.profile.settings },
      linked: { ...prev.linked, ...patch.profile.linked },
      updatedAt: now,
    };
  }
  if (patch.ranks) {
    next.ranks = { ...s.ranks };
    for (const [area, r] of Object.entries(patch.ranks) as [keyof Snapshot["ranks"], number][]) {
      next.ranks[area] = Math.max(next.ranks[area] ?? 0, r);
    }
  }
  if (patch.progress) next.progress = mergeList(s.progress, patch.progress, nodeKey, mergeNode);
  if (patch.cards) next.cards = mergeList(s.cards, patch.cards, (c) => c.id, (_old, fresh) => fresh);
  if (patch.puzzles) next.puzzles = patch.puzzles;
  if (patch.activity) {
    next.activity = { ...s.activity };
    for (const [day, n] of Object.entries(patch.activity)) next.activity[day] = (next.activity[day] ?? 0) + n;
  }
  return next;
}

/** Day key "YYYY-MM-DD" in a time zone (SPEC §17.5: the player's zone, not the server's). */
export function dayKey(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
