import { mergeCollections, mergeStats } from "utils/merge";
import { CollectionItem, UserStats } from "types";

const deck = (pathname: string, words: CollectionItem["words"], updatedAt = 1): CollectionItem => ({ name: pathname, pathname, words, updatedAt });

describe("mergeCollections", () => {
  test("keeps every deck and card from both sides", () => {
    const local = [deck("a", [{ id: 1, source: "one", target: "một" }])];
    const remote = [deck("a", [{ id: 2, source: "two", target: "hai" }]), deck("b", [{ id: 3, source: "three", target: "ba" }])];
    const merged = mergeCollections(local, remote);
    expect(merged.map((c) => c.pathname).sort()).toEqual(["a", "b"]);
    expect(merged.find((c) => c.pathname === "a")!.words.map((w) => w.id).sort()).toEqual([1, 2]);
  });

  test("the most recently reviewed copy of a card wins; stars are kept", () => {
    const local = [deck("a", [{ id: 1, source: "x", target: "x", status: "learning", lastReviewed: 100, starred: true }])];
    const remote = [deck("a", [{ id: 1, source: "x", target: "x", status: "mastered", lastReviewed: 200 }])];
    const w = mergeCollections(local, remote)[0].words[0];
    expect(w.status).toBe("mastered");
    expect(w.starred).toBe(true);
  });

  test("does not mutate its inputs", () => {
    const local = [deck("a", [{ id: 1, source: "x", target: "x" }])];
    const snapshot = JSON.stringify(local);
    mergeCollections(local, [deck("a", [{ id: 2, source: "y", target: "y" }])]);
    expect(JSON.stringify(local)).toBe(snapshot);
  });
});

describe("mergeStats", () => {
  const base: UserStats = { studyStreakDays: 3, lastStudyDate: "2026-01-02", totalCardsReviewed: 10, quizzesCompleted: 1, reviewLog: { "2026-01-01": 5, "2026-01-02": 2 } };

  test("takes the larger counters and the max per day of the review log", () => {
    const merged = mergeStats(base, { totalCardsReviewed: 50, quizzesCompleted: 0, lastStudyDate: "2026-01-02", reviewLog: { "2026-01-01": 9, "2026-01-03": 4 } });
    expect(merged.totalCardsReviewed).toBe(50);
    expect(merged.quizzesCompleted).toBe(1);
    expect(merged.reviewLog).toEqual({ "2026-01-01": 9, "2026-01-02": 2, "2026-01-03": 4 });
  });

  test("adopts the streak of a newer remote", () => {
    const merged = mergeStats(base, { lastStudyDate: "2026-01-05", studyStreakDays: 8 });
    expect(merged.studyStreakDays).toBe(8);
    expect(merged.lastStudyDate).toBe("2026-01-05");
  });
});

import { Tombstones, mergeTombstones, pruneTombstones, wordTombstoneKey, emptyTombstones } from "utils/merge";

describe("mergeCollections with tombstones", () => {
  const withId = (id: string, pathname: string, words: CollectionItem["words"], updatedAt = 1000): CollectionItem => ({ id, name: pathname, pathname, words, updatedAt });
  const tomb = (over: Partial<Tombstones> = {}): Tombstones => ({ ...emptyTombstones(), ...over });

  test("a card deleted on this device is not resurrected by the remote copy", () => {
    const local = [withId("d1", "a", [{ id: "keep", source: "k", target: "k" }])];
    const remote = [withId("d1", "a", [{ id: "keep", source: "k", target: "k" }, { id: "gone", source: "g", target: "g" }])];
    const merged = mergeCollections(local, remote, tomb({ words: { [wordTombstoneKey("d1", "gone")]: 5000 } }));
    expect(merged[0].words.map((w) => w.id)).toEqual(["keep"]);
  });

  test("a card touched after its deletion survives the tombstone", () => {
    const remote = [withId("d1", "a", [{ id: "w", source: "w", target: "w", lastReviewed: 9000 }])];
    const merged = mergeCollections([withId("d1", "a", [])], remote, tomb({ words: { [wordTombstoneKey("d1", "w")]: 5000 } }));
    expect(merged[0].words).toHaveLength(1);
  });

  test("moving a card does not duplicate it: the old deck's remote copy is dropped, the new deck keeps it", () => {
    const moved = { id: "m", source: "m", target: "m", addedAt: 6000 };
    const local = [withId("d1", "a", [], 6000), withId("d2", "b", [moved], 6000)];
    const remote = [withId("d1", "a", [{ id: "m", source: "m", target: "m" }]), withId("d2", "b", [])];
    const merged = mergeCollections(local, remote, tomb({ words: { [wordTombstoneKey("d1", "m")]: 6000 } }));
    expect(merged.find((c) => c.id === "d1")!.words).toHaveLength(0);
    expect(merged.find((c) => c.id === "d2")!.words).toHaveLength(1);
  });

  test("moving a card back after deleting it from there keeps it (addedAt beats the old tombstone)", () => {
    const back = { id: "m", source: "m", target: "m", addedAt: 9000 };
    const merged = mergeCollections([withId("d1", "a", [back], 9000)], [], tomb({ words: { [wordTombstoneKey("d1", "m")]: 6000 } }));
    expect(merged[0].words).toHaveLength(1);
  });

  test("a deleted deck stays deleted unless it was changed afterwards", () => {
    const remote = [withId("old", "old", [{ id: 1, source: "a", target: "a" }], 1000), withId("edited", "edited", [], 8000)];
    const merged = mergeCollections([], remote, tomb({ decks: { old: 5000, edited: 5000 } }));
    expect(merged.map((c) => c.id)).toEqual(["edited"]);
  });

  test("a renamed deck merges with its remote copy instead of duplicating", () => {
    const local = [withId("d1", "new-name", [{ id: 1, source: "a", target: "a" }], 7000)];
    const remote = [withId("d1", "old-name", [{ id: 2, source: "b", target: "b" }], 3000)];
    const merged = mergeCollections(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].pathname).toBe("new-name");
    expect(merged[0].words.map((w) => w.id).sort()).toEqual([1, 2]);
  });

  test("tombstone helpers: union keeps the latest time; old entries are pruned", () => {
    const a = tomb({ words: { x: 100, y: 50 } });
    expect(mergeTombstones(a, { words: { x: 80, z: 10 }, decks: { d: 1 } })).toEqual({ words: { x: 100, y: 50, z: 10 }, decks: { d: 1 } });
    const now = 200 * 86400000;
    const pruned = pruneTombstones(tomb({ decks: { old: 1, fresh: now - 1000 }, words: {} }), now);
    expect(Object.keys(pruned.decks)).toEqual(["fresh"]);
  });
});
