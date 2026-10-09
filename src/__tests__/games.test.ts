import {
  evaluateGuess,
  keyboardStates,
  gridOf,
  shareText,
  dailyIndex,
  pickDailyWord,
  dailyPool,
  wordleWords,
  wordleCoins,
  wordleScore,
  firstMeaning,
  makeTfQuestion,
  tfPoints,
  tfMultiplier,
  tfCoins,
  buildMemoryCards,
  memoryScore,
  memoryStars,
  applyGameResult,
  isNewBest,
  dailyStreak,
  mergeGameProfiles,
  profileOf
} from "utils/games";
import { mergeStats } from "utils/merge";
import { computeBadges } from "utils/badges";
import { DictEntry } from "utils/localDict";
import { UserStats, WordItem } from "types";

const stats = (over: Partial<UserStats> = {}): UserStats => ({ studyStreakDays: 1, lastStudyDate: "2026-03-10", totalCardsReviewed: 0, quizzesCompleted: 0, ...over });
const word = (id: string, source: string, target: string): WordItem => ({ id, source, target });
const seqRng = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("evaluateGuess", () => {
  test("marks exact, misplaced and missing letters", () => {
    expect(evaluateGuess("crane", "crate")).toEqual(["correct", "correct", "correct", "absent", "correct"]);
    expect(evaluateGuess("tacer", "crate")).toEqual(["present", "present", "present", "present", "present"]);
  });

  test("repeated letters are only credited as often as they occur in the answer", () => {
    // "table" has a single l: only the first l of "lilac" is credited
    expect(evaluateGuess("lilac", "table")).toEqual(["present", "absent", "absent", "present", "absent"]);
    expect(evaluateGuess("speed", "abide")).toEqual(["absent", "absent", "present", "absent", "present"]);
    expect(evaluateGuess("eerie", "there")).toEqual(["present", "absent", "present", "absent", "correct"]);
  });

  test("is case-insensitive", () => {
    expect(evaluateGuess("HOUSE", "house").every((s) => s === "correct")).toBe(true);
  });

  test("keyboard keeps the best state per letter", () => {
    const rows = [
      { guess: "abbey", states: evaluateGuess("abbey", "bible") },
      { guess: "bible", states: evaluateGuess("bible", "bible") }
    ];
    const k = keyboardStates(rows);
    expect(k.b).toBe("correct");
    expect(k.a).toBe("absent");
    expect(k.e).toBe("correct");
  });

  test("share text uses an emoji grid and X for a loss", () => {
    const grid = gridOf([evaluateGuess("crane", "crate"), evaluateGuess("crate", "crate")]);
    expect(grid).toBe("🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩");
    expect(shareText("2026-03-10", true, 2, grid)).toContain("2/6");
    expect(shareText("2026-03-10", false, 6, grid)).toContain("X/6");
  });
});

describe("daily word", () => {
  const entry = (word: string, over: Partial<DictEntry> = {}): DictEntry => ({ word, ipa: "", pos: "n", def: "", example: "", rank: 500, lemma: "", vi: "nghĩa", ...over });
  const top = [entry("house"), entry("world"), entry("going", { lemma: "go" }), entry("cat"), entry("table", { vi: "" }), entry("apple", { rank: 50 }), entry("light")];

  test("pool keeps plain 5-letter words that have a meaning and a mid rank", () => {
    expect(dailyPool(top).map((e) => e.word)).toEqual(["house", "world", "light"]);
  });

  test("the same day always gives the same word, and it changes across days", () => {
    expect(pickDailyWord(top, "2026-03-10")).toEqual(pickDailyWord(top, "2026-03-10"));
    const words = new Set(Array.from({ length: 30 }, (_, i) => pickDailyWord(top, `2026-03-${String(i + 1).padStart(2, "0")}`)!.word));
    expect(words.size).toBeGreaterThan(1);
    expect(pickDailyWord([], "2026-03-10")).toBeNull();
    expect(dailyIndex("2026-03-10", 0)).toBe(0);
  });
});

describe("deck helpers", () => {
  test("wordleWords keeps single plain words of 3-8 letters", () => {
    const list = [word("1", "cat", "mèo"), word("2", "ice cream", "kem"), word("3", "extraordinary", "phi thường"), word("4", "ok", "ổn"), word("5", "Hello", "xin chào")];
    expect(wordleWords(list).map((w) => w.source)).toEqual(["cat", "Hello"]);
  });

  test("firstMeaning drops the part-of-speech tag and extra meanings", () => {
    expect(firstMeaning("(n.) phát kiến; phát hiện")).toBe("phát kiến");
    expect(firstMeaning("mèo")).toBe("mèo");
  });

  test("coins reward fewer guesses, hints cost, daily doubles", () => {
    expect(wordleCoins({ won: true, guesses: 1, hint: false, daily: false })).toBeGreaterThan(wordleCoins({ won: true, guesses: 6, hint: false, daily: false }));
    expect(wordleCoins({ won: true, guesses: 3, hint: true, daily: false })).toBeLessThan(wordleCoins({ won: true, guesses: 3, hint: false, daily: false }));
    expect(wordleCoins({ won: true, guesses: 3, hint: false, daily: true })).toBe(2 * wordleCoins({ won: true, guesses: 3, hint: false, daily: false }));
    expect(wordleCoins({ won: false, guesses: 6, hint: false, daily: false })).toBe(0);
    expect(wordleScore(false, 6, false)).toBe(0);
    expect(wordleScore(true, 1, false)).toBeGreaterThan(wordleScore(true, 6, false));
  });
});

describe("true / false", () => {
  const pool = ["cat:mèo", "dog:chó", "bird:chim", "fish:cá", "cow:bò"].map((s, i) => word(String(i), s.split(":")[0], s.split(":")[1]));

  test("a true question shows the real meaning", () => {
    const q = makeTfQuestion(pool[0], pool, seqRng([0.1]));
    expect(q).toMatchObject({ truth: true, shown: "mèo" });
  });

  test("a false question shows another card's meaning, never its own", () => {
    for (let i = 0; i < 20; i++) {
      const q = makeTfQuestion(pool[0], pool, seqRng([0.9, 0.3, 0.6]));
      expect(q.truth).toBe(false);
      expect(q.shown).not.toBe("mèo");
      expect(pool.map((w) => w.target)).toContain(q.shown);
    }
  });

  test("falls back to a true question when no distractor exists", () => {
    expect(makeTfQuestion(pool[0], [pool[0]], seqRng([0.9])).truth).toBe(true);
  });

  test("combo multiplier grows every 5 and caps at x4", () => {
    expect([0, 4, 5, 10, 15, 99].map(tfMultiplier)).toEqual([1, 1, 2, 3, 4, 4]);
    expect(tfPoints(5)).toBe(20);
    expect(tfCoins(190)).toBe(9);
  });
});

describe("memory flip", () => {
  const words = Array.from({ length: 10 }, (_, i) => word(`w${i}`, `term${i}`, `nghĩa ${i}; khác`));

  test("builds shuffled term/meaning pairs", () => {
    const cards = buildMemoryCards(words, 6, seqRng([0.3, 0.7, 0.1]));
    expect(cards).toHaveLength(12);
    const byPair = new Map<string, string[]>();
    cards.forEach((c) => byPair.set(c.pairId, [...(byPair.get(c.pairId) || []), c.side]));
    expect(byPair.size).toBe(6);
    byPair.forEach((sides) => expect(sides.sort()).toEqual(["meaning", "term"]));
    expect(cards.find((c) => c.side === "meaning")!.text).toMatch(/^nghĩa \d$/);
  });

  test("uses fewer pairs when the deck is small and skips duplicates and long cards", () => {
    const small = [word("a", "cat", "mèo"), word("b", "Cat", "mèo con"), word("c", "x".repeat(40), "dài"), word("d", "dog", "chó")];
    expect(buildMemoryCards(small, 8)).toHaveLength(4);
  });

  test("score drops with extra moves and rewards speed; stars follow moves", () => {
    expect(memoryScore(8, 8, 20)).toBeGreaterThan(memoryScore(8, 20, 20));
    expect(memoryScore(8, 8, 10)).toBeGreaterThan(memoryScore(8, 8, 60));
    expect(memoryScore(2, 500, 500)).toBe(0);
    expect([8, 16, 40].map((m) => memoryStars(8, m))).toEqual([3, 2, 1]);
  });
});

describe("profile", () => {
  test("applyGameResult adds coins, counts plays and keeps the best score", () => {
    let s = applyGameResult(stats(), { game: "tf", score: 120, coins: 6 });
    s = applyGameResult(s, { game: "tf", score: 90, coins: 4 });
    expect(profileOf(s)).toMatchObject({ coins: 10, played: 2, best: { tf: 120 } });
    expect(isNewBest(s, "tf", 121)).toBe(true);
    expect(isNewBest(s, "tf", 120)).toBe(false);
    expect(isNewBest(s, "tf", 0)).toBe(false);
  });

  test("the daily result is stored once", () => {
    const first = applyGameResult(stats(), { game: "wordle-daily", score: 50, coins: 8, daily: { date: "2026-03-10", result: { won: true, guesses: 3, grid: "x" } } });
    const again = applyGameResult(first, { game: "wordle-daily", score: 10, coins: 2, daily: { date: "2026-03-10", result: { won: false, guesses: 6, grid: "y" } } });
    expect(profileOf(again).daily["2026-03-10"].won).toBe(true);
  });

  test("dailyStreak counts consecutive won days and survives an unplayed today", () => {
    const d = (won: boolean) => ({ won, guesses: 3, grid: "" });
    const daily = { "2026-03-07": d(true), "2026-03-08": d(true), "2026-03-09": d(true), "2026-03-10": d(true) };
    expect(dailyStreak(daily, "2026-03-10")).toBe(4);
    expect(dailyStreak(daily, "2026-03-11")).toBe(4);
    expect(dailyStreak(daily, "2026-03-12")).toBe(0);
    expect(dailyStreak({ ...daily, "2026-03-09": d(false) }, "2026-03-10")).toBe(1);
  });

  test("merging two devices keeps the best of everything", () => {
    const a = { coins: 50, played: 3, best: { tf: 100, memory: 200 }, daily: { "2026-03-09": { won: true, guesses: 2, grid: "" } } };
    const b = { coins: 70, played: 2, best: { tf: 150 }, daily: { "2026-03-10": { won: false, guesses: 6, grid: "" } } };
    const m = mergeGameProfiles(a, b)!;
    expect(m).toMatchObject({ coins: 70, played: 3, best: { tf: 150, memory: 200 } });
    expect(Object.keys(m.daily).sort()).toEqual(["2026-03-09", "2026-03-10"]);
    expect(mergeGameProfiles(undefined, undefined)).toBeUndefined();
    expect(mergeStats(stats({ games: a }), { games: b, lastStudyDate: "2026-03-01" }).games!.best.tf).toBe(150);
  });

  test("game badges", () => {
    const daily = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`2026-03-0${i + 1}`, { won: true, guesses: 3, grid: "" }]));
    const earned = computeBadges(stats({ games: { coins: 500, played: 9, best: {}, daily } }), []).filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(expect.arrayContaining(["wordle7", "coins500"]));
  });
});
