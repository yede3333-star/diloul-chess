import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/storage/streak";

describe("computeStreak (SPEC §12.4)", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak({ "2026-11-25": 1, "2026-11-26": 2, "2026-11-27": 1 }, "2026-11-27")).toEqual({ days: 3, doneToday: true });
  });
  it("is still alive from yesterday when today is not done yet", () => {
    expect(computeStreak({ "2026-11-25": 1, "2026-11-26": 1 }, "2026-11-27")).toEqual({ days: 2, doneToday: false });
  });
  it("breaks on a missed day", () => {
    expect(computeStreak({ "2026-11-24": 1, "2026-11-26": 1 }, "2026-11-27")).toEqual({ days: 1, doneToday: false });
    expect(computeStreak({ "2026-11-24": 1 }, "2026-11-27")).toEqual({ days: 0, doneToday: false });
  });
  it("crosses month boundaries", () => {
    expect(computeStreak({ "2026-11-30": 1, "2026-12-01": 1 }, "2026-12-01")).toEqual({ days: 2, doneToday: true });
  });
});
