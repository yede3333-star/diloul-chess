import { describe, expect, it } from "vitest";
import { applyPatch, dayKey, mergeSnapshots } from "@/lib/storage/merge";
import { emptySnapshot, hasData, type Snapshot } from "@/lib/storage/types";

const base = (over: Partial<Snapshot> = {}): Snapshot => ({ ...emptySnapshot(), ...over });

describe("mergeSnapshots (guest → account, SPEC §13.1)", () => {
  it("keeps the higher rank per area and never drops an area", () => {
    const account = base({ ranks: { openings: 3, puzzles: 1 } });
    const guest = base({ ranks: { openings: 1, puzzles: 4, endgames: 2 } });
    expect(mergeSnapshots(account, guest).ranks).toEqual({ openings: 3, puzzles: 4, endgames: 2 });
  });

  it("unions completed nodes, keeping max stars and the first completion date", () => {
    const account = base({ progress: [{ course: "opening:london", nodeId: "n1", stars: 2, completedAt: "2026-11-02T00:00:00Z" }] });
    const guest = base({
      progress: [
        { course: "opening:london", nodeId: "n1", stars: 3, completedAt: "2026-11-05T00:00:00Z" },
        { course: "basics", nodeId: "c1-s1-n1", stars: 1, completedAt: "2026-11-06T00:00:00Z" },
      ],
    });
    const m = mergeSnapshots(account, guest).progress;
    expect(m).toHaveLength(2);
    expect(m.find((n) => n.nodeId === "n1")).toEqual({ course: "opening:london", nodeId: "n1", stars: 3, completedAt: "2026-11-02T00:00:00Z" });
  });

  it("keeps the more recently reviewed version of a card", () => {
    const card = { id: "london:fen1", kind: "opening" as const, ref: "london", fen: "f", answerUci: "e2e4", fsrs: {}, due: "2026-12-01T00:00:00Z" };
    const account = base({ cards: [{ ...card, lastReview: "2026-11-10T00:00:00Z", fsrs: { stability: 9 } }] });
    const guest = base({ cards: [{ ...card, lastReview: "2026-11-20T00:00:00Z", fsrs: { stability: 12 } }] });
    expect(mergeSnapshots(account, guest).cards[0].fsrs).toEqual({ stability: 12 });
    expect(mergeSnapshots(guest, account).cards[0].fsrs).toEqual({ stability: 12 });
  });

  it("takes the higher puzzle rating and the max counters", () => {
    const a = base({ puzzles: { rating: 1100, rd: 80, vol: 0.06, solved: 40, streakBest: 9 } });
    const b = base({ puzzles: { rating: 1250, rd: 120, vol: 0.06, solved: 12, streakBest: 4 } });
    expect(mergeSnapshots(a, b).puzzles).toEqual({ rating: 1250, rd: 120, vol: 0.06, solved: 40, streakBest: 9 });
  });

  it("keeps the max activity per day", () => {
    const a = base({ activity: { "2026-11-26": 3, "2026-11-25": 1 } });
    const b = base({ activity: { "2026-11-26": 1, "2026-11-27": 2 } });
    expect(mergeSnapshots(a, b).activity).toEqual({ "2026-11-25": 1, "2026-11-26": 3, "2026-11-27": 2 });
  });

  it("merges profiles: newest settings win, earliest onboarding kept, nothing lost", () => {
    const account = base({
      profile: { locale: "fr", onboardingLevel: "r800", onboardedAt: "2026-10-01T00:00:00Z", basicsChapter: 3, settings: { theme: "light", sounds: false }, linked: { lichess: "yede" }, updatedAt: "2026-11-01T00:00:00Z" },
    });
    const guest = base({
      profile: { locale: "ar", onboardingLevel: "r1200", onboardedAt: "2026-11-20T00:00:00Z", basicsChapter: 4, settings: { theme: "dark" }, linked: { chesscom: "yede_cc" }, updatedAt: "2026-11-25T00:00:00Z" },
    });
    expect(mergeSnapshots(account, guest).profile).toEqual({
      locale: "ar",
      timezone: undefined,
      onboardingLevel: "r1200",
      onboardedAt: "2026-10-01T00:00:00Z",
      basicsChapter: 4,
      settings: { theme: "dark", sounds: false },
      linked: { lichess: "yede", chesscom: "yede_cc" },
      updatedAt: "2026-11-25T00:00:00Z",
    });
  });

  it("is a no-op with an empty guest", () => {
    const account = base({ ranks: { openings: 2 }, activity: { "2026-11-26": 1 } });
    expect(mergeSnapshots(account, emptySnapshot())).toEqual(account);
    expect(hasData(emptySnapshot())).toBe(false);
  });
});

describe("applyPatch (changes on this device)", () => {
  it("never lowers a rank or stars, adds activity, replaces reviewed cards", () => {
    let s = base({ ranks: { openings: 3 }, progress: [{ course: "basics", nodeId: "a", stars: 3, completedAt: "2026-11-01T00:00:00Z" }] });
    s = applyPatch(s, { ranks: { openings: 1 }, progress: [{ course: "basics", nodeId: "a", stars: 1, completedAt: "2026-11-09T00:00:00Z" }] });
    expect(s.ranks.openings).toBe(3);
    expect(s.progress[0].stars).toBe(3);
    s = applyPatch(s, { activity: { "2026-11-27": 1 } });
    s = applyPatch(s, { activity: { "2026-11-27": 2 } });
    expect(s.activity["2026-11-27"]).toBe(3);
  });

  it("creates the profile on first patch and merges settings", () => {
    let s = applyPatch(emptySnapshot(), { profile: { locale: "fr", settings: { theme: "light" } } }, "2026-11-27T10:00:00Z");
    s = applyPatch(s, { profile: { settings: { board: "wood" } } }, "2026-11-27T11:00:00Z");
    expect(s.profile).toEqual({ locale: "fr", settings: { theme: "light", board: "wood" }, linked: {}, updatedAt: "2026-11-27T11:00:00Z" });
  });
});

describe("dayKey", () => {
  it("uses the player's time zone, not UTC", () => {
    const d = new Date("2026-11-27T23:30:00Z");
    expect(dayKey(d, "Africa/Nouakchott")).toBe("2026-11-27");
    expect(dayKey(d, "Asia/Riyadh")).toBe("2026-11-28");
  });
});
