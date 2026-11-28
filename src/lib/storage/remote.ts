import type { SupabaseClient } from "@supabase/supabase-js";
import { AREAS, emptySnapshot, type Area, type OnboardingLevel, type Patch, type Settings, type Snapshot, type StorageAdapter } from "./types";

/** Signed-in storage: Supabase tables (supabase/migrations), protected by RLS. */

type ProfileRow = {
  id: string;
  locale: "ar" | "fr";
  timezone: string | null;
  onboarding_level: OnboardingLevel | null;
  onboarded_at: string | null;
  basics_chapter: number | null;
  settings: Record<string, unknown> | null;
  updated_at: string;
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function remoteAdapter(sb: SupabaseClient, userId: string): StorageAdapter {
  async function writeParts(values: Snapshot, parts: Patch | "all") {
    const all = parts === "all";
    const ops: PromiseLike<unknown>[] = [];

    if ((all || parts.profile) && values.profile) {
      const p = values.profile;
      ops.push(
        sb
          .from("profiles")
          .update({
            locale: p.locale ?? "ar",
            timezone: p.timezone ?? null,
            onboarding_level: p.onboardingLevel ?? null,
            onboarded_at: p.onboardedAt ?? null,
            basics_chapter: p.basicsChapter ?? null,
            settings: p.settings,
          })
          .eq("id", userId)
          .then(check),
      );
      const linked = Object.entries(p.linked).filter(([, u]) => !!u);
      if (linked.length) {
        ops.push(
          sb
            .from("linked_accounts")
            .upsert(linked.map(([provider, username]) => ({ user_id: userId, provider, username })))
            .then(check),
        );
      }
    }
    const ranks = all ? values.ranks : parts.ranks;
    if (ranks && Object.keys(ranks).length) {
      ops.push(
        sb
          .from("area_ranks")
          .upsert(
            (Object.keys(ranks) as Area[]).map((area) => ({ user_id: userId, area, rank: values.ranks[area] ?? 0, updated_at: new Date().toISOString() })),
          )
          .then(check),
      );
    }
    const progressKeys = new Set((all ? values.progress : parts.progress ?? []).map((n) => `${n.course}\u0000${n.nodeId}`));
    const progress = values.progress.filter((n) => progressKeys.has(`${n.course}\u0000${n.nodeId}`));
    if (progress.length) {
      ops.push(
        sb
          .from("course_progress")
          .upsert(progress.map((n) => ({ user_id: userId, course: n.course, node_id: n.nodeId, stars: n.stars, completed_at: n.completedAt })))
          .then(check),
      );
    }
    const cardIds = new Set((all ? values.cards : parts.cards ?? []).map((c) => c.id));
    const cards = values.cards.filter((c) => cardIds.has(c.id));
    if (cards.length) {
      ops.push(
        sb
          .from("srs_cards")
          .upsert(
            cards.map((c) => ({
              id: c.id,
              user_id: userId,
              kind: c.kind,
              ref: c.ref,
              fen: c.fen,
              answer_uci: c.answerUci,
              fsrs: c.fsrs,
              due: c.due,
              last_review: c.lastReview ?? null,
            })),
          )
          .then(check),
      );
    }
    if ((all || parts.puzzles) && values.puzzles) {
      const p = values.puzzles;
      ops.push(
        sb
          .from("puzzle_stats")
          .upsert({ user_id: userId, rating: p.rating, rd: p.rd, vol: p.vol, solved: p.solved, streak_best: p.streakBest })
          .then(check),
      );
    }
    const days = Object.keys(all ? values.activity : parts.activity ?? {});
    if (days.length) {
      ops.push(
        sb
          .from("daily_activity")
          .upsert(days.map((day) => ({ user_id: userId, day, actions: values.activity[day] })))
          .then(check),
      );
    }
    await Promise.all(ops);
  }

  return {
    kind: "remote",
    async load() {
      const [profile, linked, ranks, progress, cards, puzzles, activity] = await Promise.all([
        sb.from("profiles").select("id, locale, timezone, onboarding_level, onboarded_at, basics_chapter, settings, updated_at").eq("id", userId).maybeSingle().then(check),
        sb.from("linked_accounts").select("provider, username").then(check),
        sb.from("area_ranks").select("area, rank").then(check),
        sb.from("course_progress").select("course, node_id, stars, completed_at").then(check),
        sb.from("srs_cards").select("id, kind, ref, fen, answer_uci, fsrs, due, last_review").then(check),
        sb.from("puzzle_stats").select("rating, rd, vol, solved, streak_best").maybeSingle().then(check),
        sb.from("daily_activity").select("day, actions").then(check),
      ]);

      const s = emptySnapshot();
      const p = profile as ProfileRow | null;
      if (p) {
        s.profile = {
          locale: p.locale,
          timezone: p.timezone ?? undefined,
          onboardingLevel: p.onboarding_level ?? undefined,
          onboardedAt: p.onboarded_at ?? undefined,
          basicsChapter: p.basics_chapter ?? undefined,
          settings: (p.settings ?? {}) as Settings,
          linked: Object.fromEntries((linked as { provider: string; username: string }[]).map((l) => [l.provider, l.username])),
          updatedAt: p.updated_at,
        };
      }
      for (const r of ranks as { area: Area; rank: number }[]) if (AREAS.includes(r.area)) s.ranks[r.area] = r.rank;
      s.progress = (progress as { course: string; node_id: string; stars: number; completed_at: string }[]).map((n) => ({
        course: n.course,
        nodeId: n.node_id,
        stars: n.stars,
        completedAt: n.completed_at,
      }));
      s.cards = (cards as { id: string; kind: "opening" | "mistake"; ref: string; fen: string; answer_uci: string; fsrs: Record<string, unknown>; due: string; last_review: string | null }[]).map((c) => ({
        id: c.id,
        kind: c.kind,
        ref: c.ref,
        fen: c.fen,
        answerUci: c.answer_uci,
        fsrs: c.fsrs,
        due: c.due,
        lastReview: c.last_review ?? undefined,
      }));
      const pz = puzzles as { rating: number; rd: number; vol: number; solved: number; streak_best: number } | null;
      if (pz) s.puzzles = { rating: pz.rating, rd: pz.rd, vol: pz.vol, solved: pz.solved, streakBest: pz.streak_best };
      for (const a of activity as { day: string; actions: number }[]) s.activity[a.day] = a.actions;
      return s;
    },
    write: (values, changed) => writeParts(values, changed),
    writeAll: (values) => writeParts(values, "all"),
    async clear() {
      // Account data is only deleted by deleting the account (SPEC §19.6), never by sign-out.
    },
  };
}
