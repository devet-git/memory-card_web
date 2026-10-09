import {
  DEFAULT_W,
  retrievability,
  intervalFor,
  review,
  initialDifficulty,
  nextDifficulty,
  stabilityAfterRecall,
  stabilityAfterForget,
  difficultyFromEase,
  clampRetention
} from "utils/fsrs";
import { schedule, previewInterval, DAY_MS } from "utils/srs";
import { WordItem } from "types";

const NOW = 1_700_000_000_000;
const word = (over: Partial<WordItem> = {}): WordItem => ({ id: "w", source: "cat", target: "mèo", ...over });
const fsrs = { algorithm: "fsrs" as const, retention: 0.9 };

describe("forgetting curve", () => {
  test("recall is 90% after exactly S days and falls over time", () => {
    expect(retrievability(0, 10)).toBe(1);
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 6);
    expect(retrievability(40, 10)).toBeLessThan(retrievability(10, 10));
  });

  test("the interval for 90% retention equals the stability; lower retention waits longer", () => {
    expect(intervalFor(7, 0.9)).toBeCloseTo(7, 6);
    expect(intervalFor(7, 0.8)).toBeGreaterThan(intervalFor(7, 0.9));
    expect(retrievability(intervalFor(5, 0.85), 5)).toBeCloseTo(0.85, 6);
  });
});

describe("difficulty and stability", () => {
  test("first difficulty is higher for worse answers and stays within 1..10", () => {
    expect(initialDifficulty(1)).toBeGreaterThan(initialDifficulty(3));
    expect(initialDifficulty(3)).toBeGreaterThan(initialDifficulty(4));
    for (const r of [1, 2, 3, 4] as const) {
      const d = initialDifficulty(r);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(10);
    }
  });

  test("repeated Again pushes difficulty up but never past 10; repeated Easy never below 1", () => {
    let d = 5;
    for (let i = 0; i < 200; i++) d = nextDifficulty(d, 1);
    expect(d).toBeLessThanOrEqual(10);
    expect(d).toBeGreaterThan(8);
    for (let i = 0; i < 200; i++) d = nextDifficulty(d, 4);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThan(4);
  });

  test("recalling at a lower retrievability grows stability more (desirable difficulty)", () => {
    const early = stabilityAfterRecall(5, 10, 0.95, 3);
    const late = stabilityAfterRecall(5, 10, 0.7, 3);
    expect(late).toBeGreaterThan(early);
    expect(early).toBeGreaterThan(10);
  });

  test("Hard grows less than Good, Good less than Easy; harder cards grow slower", () => {
    const [hard, good, easy] = ([2, 3, 4] as const).map((r) => stabilityAfterRecall(5, 10, 0.9, r));
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
    expect(stabilityAfterRecall(9, 10, 0.9, 3)).toBeLessThan(stabilityAfterRecall(2, 10, 0.9, 3));
  });

  test("forgetting lowers stability and never raises it", () => {
    const after = stabilityAfterForget(5, 30, 0.8);
    expect(after).toBeLessThan(30);
    expect(after).toBeGreaterThan(0);
    expect(stabilityAfterForget(5, 0.5, 0.9)).toBeLessThanOrEqual(0.5);
  });

  test("SM-2 ease maps to difficulty monotonically", () => {
    expect(difficultyFromEase(1.3)).toBeGreaterThan(difficultyFromEase(2.5));
    expect(difficultyFromEase(2.5)).toBeCloseTo(5, 6);
    expect(difficultyFromEase(3.5)).toBeLessThan(difficultyFromEase(2.5));
    expect(difficultyFromEase(0)).toBeLessThanOrEqual(10);
  });
});

describe("review()", () => {
  test("a new card starts from the initial stabilities and orders its intervals", () => {
    const out = review(null, 0, 0.9);
    expect(out[1].interval).toBe(0);
    expect(out[3].stability).toBeCloseTo(DEFAULT_W[2], 6);
    expect(out[2].interval).toBeGreaterThanOrEqual(1);
    expect(out[2].interval).toBeLessThan(out[3].interval);
    expect(out[3].interval).toBeLessThan(out[4].interval);
  });

  test("a higher retention target gives shorter intervals", () => {
    const state = { stability: 20, difficulty: 5 };
    expect(review(state, 20, 0.95)[3].interval).toBeLessThan(review(state, 20, 0.8)[3].interval);
  });

  test("intervals are strictly ordered even for tiny stabilities", () => {
    const out = review({ stability: 0.05, difficulty: 9 }, 0, 0.9);
    expect(out[2].interval).toBeLessThan(out[3].interval);
    expect(out[3].interval).toBeLessThan(out[4].interval);
  });

  test("clampRetention keeps the target in a sane range", () => {
    expect(clampRetention(undefined)).toBe(0.9);
    expect(clampRetention(0.1)).toBe(0.7);
    expect(clampRetention(2)).toBe(0.97);
    expect(clampRetention(NaN)).toBe(0.9);
  });
});

describe("schedule() with FSRS", () => {
  test("first review stores stability and difficulty and schedules by retention", () => {
    const next = schedule(word(), 2, NOW, fsrs);
    expect(next.stability).toBeGreaterThan(0);
    expect(next.difficulty).toBeGreaterThanOrEqual(1);
    expect(next.intervalDays).toBe(4);
    expect(next.dueDate).toBe(NOW + 4 * DAY_MS);
    expect(next.status).toBe("learning");
  });

  test("Again counts a lapse and a wrong answer, and is due again within the session", () => {
    const next = schedule(word({ intervalDays: 10, ease: 2.5, lapses: 1, wrongCount: 2 }), 0, NOW, fsrs);
    expect(next.intervalDays).toBe(0);
    expect(next.lapses).toBe(2);
    expect(next.wrongCount).toBe(3);
    expect(next.dueDate!).toBeLessThan(NOW + DAY_MS);
    expect(next.stability!).toBeLessThan(10);
  });

  test("a card scheduled by SM-2 continues from its interval and ease", () => {
    const sm2 = word({ intervalDays: 10, ease: 2.5, lastReviewed: NOW - 10 * DAY_MS, dueDate: NOW });
    const next = schedule(sm2, 2, NOW, fsrs);
    expect(next.intervalDays!).toBeGreaterThan(10);
    expect(next.difficulty!).toBeCloseTo(5, 0);
  });

  test("answering later than planned earns a longer interval than answering on time", () => {
    const base = word({ stability: 10, difficulty: 5, intervalDays: 10, lastReviewed: NOW - 10 * DAY_MS });
    const onTime = schedule(base, 2, NOW, fsrs).intervalDays!;
    const late = schedule(base, 2, NOW + 20 * DAY_MS, fsrs).intervalDays!;
    expect(late).toBeGreaterThan(onTime);
  });

  test("Hard < Good < Easy for a mature card", () => {
    const base = word({ stability: 15, difficulty: 6, intervalDays: 15, lastReviewed: NOW - 15 * DAY_MS });
    const [h, g, e] = ([1, 2, 3] as const).map((gr) => schedule(base, gr, NOW, fsrs).intervalDays!);
    expect(h).toBeLessThan(g);
    expect(g).toBeLessThan(e);
  });

  test("a card with a 21+ day interval is mastered", () => {
    const base = word({ stability: 60, difficulty: 4, intervalDays: 60, lastReviewed: NOW - 60 * DAY_MS });
    expect(schedule(base, 2, NOW, fsrs).status).toBe("mastered");
  });

  test("a streak of Good answers keeps growing the interval", () => {
    let w = word();
    let t = NOW;
    let last = 0;
    for (let i = 0; i < 8; i++) {
      w = { ...w, ...schedule(w, 2, t, fsrs), lastReviewed: t };
      expect(w.intervalDays!).toBeGreaterThan(last);
      last = w.intervalDays!;
      t += w.intervalDays! * DAY_MS;
    }
    expect(last).toBeGreaterThan(60);
  });

  test("switching back to SM-2 drops the FSRS state and keeps the interval", () => {
    const withFsrs = word({ stability: 12, difficulty: 5, intervalDays: 12, ease: 2.5 });
    const next = schedule(withFsrs, 2, NOW);
    expect(next.stability).toBeUndefined();
    expect(next.difficulty).toBeUndefined();
    expect(next.intervalDays).toBe(Math.round(12 * 2.5));
  });

  test("SM-2 stays the default", () => {
    expect(schedule(word(), 2, NOW).intervalDays).toBe(1);
    expect(schedule(word(), 2, NOW, { algorithm: "sm2" }).intervalDays).toBe(1);
  });

  test("previewInterval follows the chosen algorithm", () => {
    expect(previewInterval(word(), 2)).toBe("1 ngày");
    expect(previewInterval(word(), 2, fsrs)).toBe("4 ngày");
  });
});
