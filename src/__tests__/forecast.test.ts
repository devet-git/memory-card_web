import { buildForecast } from "utils/forecast";
import { bestHour, hourSlots, hourToTime } from "utils/studyHours";
import { CollectionItem, UserStats } from "types";

const NOW = new Date(2026, 2, 10, 15, 0, 0); // 10 Mar 2026, local
const dayAt = (offset: number, hour = 9) => new Date(2026, 2, 10 + offset, hour).getTime();
const deck = (dues: (number | undefined)[]): CollectionItem[] => [
  { name: "d", pathname: "d", words: dues.map((dueDate, i) => ({ id: i, source: "a", target: "b", dueDate })) }
];

describe("buildForecast", () => {
  test("buckets cards by local day and folds overdue into today", () => {
    const f = buildForecast(deck([dayAt(-3), dayAt(0, 1), dayAt(1), dayAt(1, 23), dayAt(5), undefined]), 14, NOW);
    expect(f.days).toHaveLength(14);
    expect(f.days[0].count).toBe(2); // overdue + due earlier today
    expect(f.overdue).toBe(1);
    expect(f.days[1].count).toBe(2);
    expect(f.days[5].count).toBe(1);
    expect(f.total).toBe(5);
    expect(f.peak?.key).toBe(f.days[0].key);
  });

  test("ignores cards beyond the window", () => {
    const f = buildForecast(deck([dayAt(40)]), 14, NOW);
    expect(f.total).toBe(0);
    expect(f.peak).toBeNull();
  });
});

describe("study hours", () => {
  const stats = (hourLog: UserStats["hourLog"]): UserStats => ({ studyStreakDays: 1, lastStudyDate: "2026-03-10", totalCardsReviewed: 0, quizzesCompleted: 0, hourLog });

  test("no advice before there is enough data", () => {
    expect(bestHour(stats({ "8": [10, 9] }))).toBeNull();
  });

  test("picks the most accurate hour with enough practice", () => {
    const s = stats({ "7": [20, 12], "20": [20, 18], "3": [2, 2] });
    expect(bestHour(s)?.hour).toBe(20);
    expect(hourSlots(s)).toHaveLength(24);
    expect(hourToTime(7)).toBe("07:00");
  });
});
