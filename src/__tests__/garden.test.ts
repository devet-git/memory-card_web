import { plantOf, emojiOf, sortPlants, summarize, DEFAULT_SKIN, FRESH_AT, WILTED_BELOW } from "utils/garden";
import { DAY_MS } from "utils/srs";
import { WordItem } from "types";

const NOW = 1_800_000_000_000;
const word = (over: Partial<WordItem> = {}): WordItem => ({ id: "w", source: "cat", target: "mèo", ...over });

describe("plantOf", () => {
  test("a card never reviewed is a seed with no health", () => {
    expect(plantOf(word(), NOW)).toMatchObject({ stage: "seed", health: null, thirst: "fresh" });
  });

  test("stage follows the interval; mastered cards bloom", () => {
    const at = (intervalDays: number, extra: Partial<WordItem> = {}) => plantOf(word({ reviewCount: 3, intervalDays, lastReviewed: NOW, ...extra }), NOW).stage;
    expect([at(1), at(6), at(7), at(20), at(21)]).toEqual(["sprout", "sprout", "tree", "tree", "bloom"]);
    expect(at(2, { status: "mastered" })).toBe("bloom");
  });

  test("health is the predicted recall: 90% at the planned interval, falling afterwards", () => {
    const base = { reviewCount: 2, intervalDays: 10, stability: 10, lastReviewed: NOW - 10 * DAY_MS };
    expect(plantOf(word(base), NOW).health).toBeCloseTo(0.9, 2);
    expect(plantOf(word({ ...base, lastReviewed: NOW }), NOW).health).toBe(1);
    expect(plantOf(word({ ...base, lastReviewed: NOW - 60 * DAY_MS }), NOW).health!).toBeLessThan(0.7);
  });

  test("works for cards scheduled by SM-2 (no stability) using the interval", () => {
    const p = plantOf(word({ reviewCount: 2, intervalDays: 8, lastReviewed: NOW - 8 * DAY_MS }), NOW);
    expect(p.health!).toBeCloseTo(0.9, 2);
  });

  test("thirst thresholds", () => {
    const fresh = plantOf(word({ reviewCount: 1, intervalDays: 10, lastReviewed: NOW - 2 * DAY_MS }), NOW);
    const thirsty = plantOf(word({ reviewCount: 1, intervalDays: 10, lastReviewed: NOW - 18 * DAY_MS }), NOW);
    const wilted = plantOf(word({ reviewCount: 1, intervalDays: 10, lastReviewed: NOW - 80 * DAY_MS }), NOW);
    expect(fresh.health!).toBeGreaterThanOrEqual(FRESH_AT);
    expect(thirsty.health!).toBeGreaterThanOrEqual(WILTED_BELOW);
    expect([fresh.thirst, thirsty.thirst, wilted.thirst]).toEqual(["fresh", "thirsty", "wilted"]);
  });

  test("a card just failed (interval 0) wilts quickly instead of crashing", () => {
    const p = plantOf(word({ reviewCount: 4, intervalDays: 0, lastReviewed: NOW - 3 * DAY_MS }), NOW);
    expect(p.thirst).toBe("wilted");
    expect(p.health!).toBeGreaterThan(0);
  });
});

describe("garden helpers", () => {
  const plants = [
    plantOf(word({ id: "seed" }), NOW),
    plantOf(word({ id: "ok", reviewCount: 2, intervalDays: 30, stability: 30, lastReviewed: NOW - 2 * DAY_MS }), NOW),
    plantOf(word({ id: "dry", reviewCount: 2, intervalDays: 3, lastReviewed: NOW - 40 * DAY_MS }), NOW)
  ];

  test("emoji uses the wilted face for wilted plants and a custom skin when given", () => {
    expect(emojiOf(plants[2])).toBe(DEFAULT_SKIN.wilted);
    expect(emojiOf(plants[1])).toBe(DEFAULT_SKIN.bloom);
    expect(emojiOf(plants[0])).toBe(DEFAULT_SKIN.seed);
    expect(emojiOf(plants[1], { ...DEFAULT_SKIN, bloom: "🌼" })).toBe("🌼");
  });

  test("thirsty plants come first, seeds last", () => {
    expect(sortPlants(plants).map((p) => p.word.id)).toEqual(["dry", "ok", "seed"]);
  });

  test("summary counts stages and averages the health of reviewed cards", () => {
    const s = summarize(plants);
    expect(s).toMatchObject({ total: 3, fresh: 1, wilted: 1, thirsty: 0 });
    expect(s.stages).toEqual({ seed: 1, sprout: 1, tree: 0, bloom: 1 });
    expect(s.health).toBeGreaterThan(0);
    expect(summarize([]).health).toBe(0);
  });
});
