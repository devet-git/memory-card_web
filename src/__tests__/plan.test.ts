import { buildDailyPlan, isLeech } from "utils/plan";
import { CollectionItem, WordItem } from "types";

const NOW = 1_700_000_000_000;
const DAY = 86400000;
const w = (id: string, over: Partial<WordItem> = {}): WordItem => ({ id, source: id, target: id, ...over });
const deck = (pathname: string, words: WordItem[]): CollectionItem => ({ name: pathname, pathname, words });

describe("isLeech", () => {
  test("many lapses or many wrong answers", () => {
    expect(isLeech(w("a", { lapses: 4 }))).toBe(true);
    expect(isLeech(w("a", { wrongCount: 6 }))).toBe(true);
    expect(isLeech(w("a", { lapses: 3, wrongCount: 5 }))).toBe(false);
  });
});

describe("buildDailyPlan", () => {
  const collections = [
    deck("a", [
      w("late", { dueDate: NOW - 3 * DAY, reviewCount: 2 }),
      w("recent", { dueDate: NOW - 1000, reviewCount: 2 }),
      w("future", { dueDate: NOW + DAY, reviewCount: 2 }),
      w("leech-future", { dueDate: NOW + DAY, reviewCount: 9, lapses: 5, wrongCount: 7 }),
      w("leech-due", { dueDate: NOW - 1, reviewCount: 9, lapses: 4 }),
      w("new1"),
      w("new2")
    ]),
    deck("b", [w("b-new"), w("b-due", { dueDate: NOW - 10, reviewCount: 1 })])
  ];

  test("order: most overdue first, then leech practice, then new cards", () => {
    const plan = buildDailyPlan(collections, { now: NOW });
    expect(plan.items.map((i) => i.wordId)).toEqual(["late", "recent", "b-due", "leech-due", "leech-future", "new1", "new2", "b-new"]);
    expect(plan.items[0].wordId).toBe("late");
    const kinds = plan.items.map((i) => i.kind);
    expect(kinds.lastIndexOf("due")).toBeLessThan(kinds.indexOf("leech"));
    expect(kinds.lastIndexOf("leech")).toBeLessThan(kinds.indexOf("new"));
  });

  test("counts", () => {
    const plan = buildDailyPlan(collections, { now: NOW });
    expect(plan).toMatchObject({ due: 4, leeches: 1, fresh: 3, leechTotal: 2 });
  });

  test("respects the new-card and leech limits", () => {
    const plan = buildDailyPlan(collections, { now: NOW, newLimit: 1, leechLimit: 0 });
    expect(plan.fresh).toBe(1);
    expect(plan.leeches).toBe(0);
  });

  test("can be limited to one deck", () => {
    const plan = buildDailyPlan(collections, { now: NOW, deck: "b" });
    expect(plan.items.map((i) => i.wordId)).toEqual(["b-due", "b-new"]);
  });

  test("leech-only mode lists every leech, worst first, and nothing else", () => {
    const plan = buildDailyPlan(collections, { now: NOW, onlyLeeches: true });
    expect(plan.items.map((i) => i.wordId)).toEqual(["leech-future", "leech-due"]);
    expect(plan.items.every((i) => i.kind === "leech")).toBe(true);
    expect(plan.fresh).toBe(0);
  });

  test("well-known due cards may be reversed, but never leeches or young cards", () => {
    const known = [deck("a", [w("old", { dueDate: NOW - 1, intervalDays: 30 }), w("young", { dueDate: NOW - 1, intervalDays: 2 }), w("leech", { dueDate: NOW - 1, intervalDays: 30, lapses: 5 })])];
    const always = buildDailyPlan(known, { now: NOW, reverse: true, random: () => 0 });
    const reversed = Object.fromEntries(always.items.map((i) => [i.wordId, i.reversed]));
    expect(reversed).toEqual({ old: true, young: false, leech: false });
    const off = buildDailyPlan(known, { now: NOW, reverse: false, random: () => 0 });
    expect(off.items.every((i) => !i.reversed)).toBe(true);
  });
});

describe("buildDailyPlan with several decks", () => {
  const decks = [deck("a", [w("a1")]), deck("b", [w("b1")]), deck("c", [w("c1")])];

  test("a list of decks limits the session to those decks", () => {
    expect(buildDailyPlan(decks, { now: NOW, deck: ["a", "c"] }).items.map((i) => i.wordId).sort()).toEqual(["a1", "c1"]);
  });

  test("an empty list means all decks", () => {
    expect(buildDailyPlan(decks, { now: NOW, deck: [] }).items).toHaveLength(3);
  });
});
