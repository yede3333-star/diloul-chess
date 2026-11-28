/** The seven ranks, in order (SPEC §5.1). Goals per rank go in src/config/ranks.ts (phase 1). */
export const RANK_KEYS = ["start", "novice", "amateur", "trainee", "skilled", "expert", "master"] as const;
export type RankKey = (typeof RANK_KEYS)[number];
