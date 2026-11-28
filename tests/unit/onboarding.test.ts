import { describe, expect, it } from "vitest";
import { LEVEL_START } from "@/config/onboarding";
import { ONBOARDING_LEVELS } from "@/lib/storage/types";

describe("onboarding levels (SPEC §5.4)", () => {
  it("cover every level with valid ranks, ratings and chapters, increasing with level", () => {
    let prev = -1;
    for (const level of ONBOARDING_LEVELS) {
      const s = LEVEL_START[level];
      for (const r of Object.values(s.ranks)) {
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(6);
      }
      expect(s.puzzleRating).toBeGreaterThanOrEqual(400);
      expect(s.puzzleRating).toBeLessThanOrEqual(2600);
      expect(s.basicsChapter).toBeGreaterThanOrEqual(1);
      expect(s.basicsChapter).toBeLessThanOrEqual(9);
      expect(s.puzzleRating).toBeGreaterThan(prev);
      prev = s.puzzleRating;
    }
  });
});
