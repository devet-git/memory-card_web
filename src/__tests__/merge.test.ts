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
