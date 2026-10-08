import { schedule, isDue, isNewCard, previewInterval, DAY_MS, MIN_EASE } from "utils/srs";
import { WordItem } from "types";

const word = (over: Partial<WordItem> = {}): WordItem => ({ id: "w1", source: "cat", target: "mèo", ...over });
const NOW = 1_700_000_000_000;

describe("schedule", () => {
  test("first Good review is due in 1 day", () => {
    const next = schedule(word(), 2, NOW);
    expect(next.intervalDays).toBe(1);
    expect(next.dueDate).toBe(NOW + DAY_MS);
    expect(next.status).toBe("learning");
  });

  test("Good review grows the interval: 1 -> 3 -> multiplied by ease", () => {
    const second = schedule(word({ intervalDays: 1 }), 2, NOW);
    expect(second.intervalDays).toBe(3);
    const third = schedule(word({ intervalDays: 3, ease: 2.5 }), 2, NOW);
    expect(third.intervalDays).toBe(Math.round(3 * 2.5));
  });

  test("Again resets the interval, lowers ease, counts a lapse and a wrong answer", () => {
    const next = schedule(word({ intervalDays: 10, ease: 2.5, lapses: 1, wrongCount: 2 }), 0, NOW);
    expect(next.intervalDays).toBe(0);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.lapses).toBe(2);
    expect(next.wrongCount).toBe(3);
    expect(next.dueDate).toBeLessThan(NOW + DAY_MS); // seen again within the session
  });

  test("ease never drops below the minimum", () => {
    let w = word({ ease: 1.35 });
    for (let i = 0; i < 5; i++) w = { ...w, ...schedule(w, 0, NOW) };
    expect(w.ease).toBe(MIN_EASE);
  });

  test("Easy jumps further than Good, Hard less", () => {
    const base = word({ intervalDays: 10, ease: 2.5 });
    const hard = schedule(base, 1, NOW).intervalDays!;
    const good = schedule(base, 2, NOW).intervalDays!;
    const easy = schedule(base, 3, NOW).intervalDays!;
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  test("a card with a 21+ day interval is mastered", () => {
    expect(schedule(word({ intervalDays: 20, ease: 2.5 }), 2, NOW).status).toBe("mastered");
  });
});

describe("queue helpers", () => {
  test("isDue / isNewCard", () => {
    expect(isNewCard(word())).toBe(true);
    expect(isNewCard(word({ reviewCount: 2 }))).toBe(false);
    expect(isDue(word({ dueDate: NOW - 1 }), NOW)).toBe(true);
    expect(isDue(word({ dueDate: NOW + 1 }), NOW)).toBe(false);
    expect(isDue(word(), NOW)).toBe(false);
  });

  test("previewInterval is human readable", () => {
    expect(previewInterval(word(), 0)).toBe("<10 phút");
    expect(previewInterval(word(), 2)).toBe("1 ngày");
    expect(previewInterval(word({ intervalDays: 60, ease: 2.5 }), 2)).toMatch(/tháng/);
  });
});
