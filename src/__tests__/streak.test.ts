import { recordStudy, undoStudy, grantMonthlyFreezes, weekProgress, daysBetween, addDays, MAX_FREEZES } from "utils/streak";
import { UserStats } from "types";
import { mergeStats } from "utils/merge";

const at = (iso: string) => new Date(`${iso}:00`); // local time
const base = (over: Partial<UserStats> = {}): UserStats => ({
  studyStreakDays: 5,
  lastStudyDate: "2026-03-10",
  totalCardsReviewed: 10,
  quizzesCompleted: 0,
  freezeMonth: "2026-03",
  freezes: 2,
  ...over
});

describe("date helpers", () => {
  test("daysBetween / addDays across month and year ends", () => {
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3);
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("recordStudy", () => {
  test("a second review on the same day keeps the streak", () => {
    const next = recordStudy(base({ lastStudyDate: "2026-03-10" }), true, at("2026-03-10T09:00"));
    expect(next.studyStreakDays).toBe(5);
    expect(next.reviewLog?.["2026-03-10"]).toBe(1);
    expect(next.totalCardsReviewed).toBe(11);
  });

  test("studying the next day extends the streak without spending freezes", () => {
    const next = recordStudy(base(), true, at("2026-03-11T09:00"));
    expect(next.studyStreakDays).toBe(6);
    expect(next.freezes).toBe(2);
  });

  test("one missed day is covered by a freeze", () => {
    const next = recordStudy(base(), true, at("2026-03-12T09:00"));
    expect(next.studyStreakDays).toBe(6);
    expect(next.freezes).toBe(1);
    expect(next.frozenDays).toEqual(["2026-03-11"]);
  });

  test("two missed days use two freezes", () => {
    const next = recordStudy(base(), true, at("2026-03-13T09:00"));
    expect(next.studyStreakDays).toBe(6);
    expect(next.freezes).toBe(0);
    expect(next.frozenDays).toEqual(["2026-03-11", "2026-03-12"]);
  });

  test("not enough freezes resets the streak and keeps the freezes", () => {
    const next = recordStudy(base({ freezes: 1 }), true, at("2026-03-13T09:00"));
    expect(next.studyStreakDays).toBe(1);
    expect(next.freezes).toBe(1);
    expect(next.frozenDays).toBeUndefined();
  });

  test("a long absence resets the streak even with freezes", () => {
    const next = recordStudy(base({ freezes: 3 }), true, at("2026-03-20T09:00"));
    expect(next.studyStreakDays).toBe(1);
    expect(next.freezes).toBe(3);
  });

  test("tracks the hour pattern with correctness", () => {
    let s = recordStudy(base(), true, at("2026-03-10T07:10"));
    s = recordStudy(s, false, at("2026-03-10T07:40"));
    expect(s.hourLog?.["7"]).toEqual([2, 1]);
  });
});

describe("monthly freezes", () => {
  test("granted once per month and capped", () => {
    const first = grantMonthlyFreezes({ ...base(), freezeMonth: undefined, freezes: undefined }, "2026-03-05");
    expect(first.freezes).toBe(2);
    expect(grantMonthlyFreezes(first, "2026-03-28")).toBe(first);
    expect(grantMonthlyFreezes(first, "2026-04-01").freezes).toBe(MAX_FREEZES);
  });

  test("a new month tops up before a missed day is bridged", () => {
    const next = recordStudy(base({ freezeMonth: "2026-02", freezes: 0, lastStudyDate: "2026-03-31" }), true, at("2026-04-02T09:00"));
    expect(next.studyStreakDays).toBe(6);
    expect(next.freezes).toBe(1);
  });
});

test("undoStudy takes back the counters", () => {
  const s = recordStudy(base(), true, at("2026-03-10T09:00"));
  const undone = undoStudy(s, at("2026-03-10T09:05"));
  expect(undone.reviewLog?.["2026-03-10"]).toBe(0);
  expect(undone.totalCardsReviewed).toBe(10);
});

test("weekProgress counts studied and frozen days, Monday first", () => {
  // 2026-03-11 is a Wednesday
  const p = weekProgress(base({ reviewLog: { "2026-03-09": 3, "2026-03-11": 1 }, frozenDays: ["2026-03-10"] }), "2026-03-11");
  expect(p.days[0].key).toBe("2026-03-09");
  expect(p.days[6].key).toBe("2026-03-15");
  expect(p.studied).toBe(3);
  expect(p.days[1].frozen).toBe(true);
});

test("mergeStats unions frozen days and keeps the larger hour counts", () => {
  const merged = mergeStats(
    base({ frozenDays: ["2026-03-01"], hourLog: { "7": [3, 2] } }),
    { frozenDays: ["2026-03-02"], hourLog: { "7": [5, 4], "8": [1, 1] }, lastStudyDate: "2026-03-05" }
  );
  expect(merged.frozenDays).toEqual(["2026-03-01", "2026-03-02"]);
  expect(merged.hourLog).toEqual({ "7": [5, 4], "8": [1, 1] });
});
