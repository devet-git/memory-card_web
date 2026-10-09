import { computeBadges } from "utils/badges";
import { CollectionItem, UserStats } from "types";

const stats = (over: Partial<UserStats> = {}): UserStats => ({ studyStreakDays: 1, lastStudyDate: "2026-01-01", totalCardsReviewed: 0, quizzesCompleted: 0, ...over });
const decks = (n: number, mastered = 0): CollectionItem[] =>
  Array.from({ length: n }, (_, i) => ({
    name: `d${i}`,
    pathname: `d${i}`,
    words: Array.from({ length: mastered }, (_, j) => ({ id: `${i}-${j}`, source: "a", target: "b", status: "mastered" as const }))
  }));
const earned = (b: ReturnType<typeof computeBadges>) => b.filter((x) => x.earned).map((x) => x.id);

describe("computeBadges", () => {
  test("nothing earned at the start", () => {
    expect(earned(computeBadges(stats(), []))).toEqual([]);
  });

  test("review and deck milestones", () => {
    const ids = earned(computeBadges(stats({ totalCardsReviewed: 120 }), decks(5)));
    expect(ids).toEqual(expect.arrayContaining(["review100", "decks5"]));
    expect(ids).not.toContain("review1000");
  });

  test("the longest run in the review log counts for the streak badges", () => {
    const log = { "2026-01-01": 1, "2026-01-02": 2, "2026-01-03": 1, "2026-01-10": 1 };
    const ids = earned(computeBadges(stats({ studyStreakDays: 1, reviewLog: log }), []));
    expect(ids).toContain("streak3");
    expect(ids).not.toContain("streak7");
  });

  test("mastered cards are counted across decks", () => {
    expect(earned(computeBadges(stats(), decks(2, 5)))).toContain("master10");
  });

  test("secret badges depend on the hour pattern and freezes", () => {
    expect(earned(computeBadges(stats(), []))).not.toEqual(expect.arrayContaining(["dawn", "night", "freeze"]));
    const ids = earned(computeBadges(stats({ hourLog: { "5": [1, 1], "23": [2, 1] }, frozenDays: ["2026-01-02"] }), []));
    expect(ids).toEqual(expect.arrayContaining(["dawn", "night", "freeze"]));
    expect(computeBadges(stats(), []).filter((b) => b.hidden).map((b) => b.id)).toEqual(["dawn", "night", "freeze"]);
  });

  test("frozen days keep a run going and the goal run needs the daily goal", () => {
    const log = { "2026-01-01": 25, "2026-01-02": 30, "2026-01-04": 25, "2026-01-05": 22 };
    const ids = earned(computeBadges(stats({ studyStreakDays: 1, reviewLog: log, frozenDays: ["2026-01-03"] }), [], 20));
    expect(ids).toContain("streak3");
    expect(ids).not.toContain("goal7");
  });

  test("starred cards are counted", () => {
    const d = decks(1);
    d[0].words = Array.from({ length: 20 }, (_, i) => ({ id: i, source: "a", target: "b", starred: true }));
    expect(earned(computeBadges(stats(), d))).toContain("starred20");
  });
});
