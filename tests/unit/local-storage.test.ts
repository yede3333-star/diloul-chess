import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { localAdapter } from "@/lib/storage/local";
import { applyPatch } from "@/lib/storage/merge";
import { emptySnapshot } from "@/lib/storage/types";

describe("localAdapter (guest IndexedDB)", () => {
  it("round-trips a snapshot and clears it", async () => {
    expect(await localAdapter.load()).toEqual(emptySnapshot());
    const s = applyPatch(emptySnapshot(), { ranks: { puzzles: 2 }, activity: { "2026-11-27": 1 } });
    await localAdapter.write(s, { ranks: { puzzles: 2 } });
    expect(await localAdapter.load()).toEqual(s);
    await localAdapter.clear();
    expect(await localAdapter.load()).toEqual(emptySnapshot());
  });
});
