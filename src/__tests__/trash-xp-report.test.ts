import { trashWords, trashDeck, restoreEntry, pruneTrash, daysLeft, TRASH_DAYS, MAX_TRASH } from "utils/trash";
import { mergeCollections, deckKey, wordTombstoneKey, emptyTombstones } from "utils/merge";
import { subtitleToText, extractCandidates } from "utils/extractWords";
import { levelInfo, xpOf, xpForLevel, titleOf } from "utils/xp";
import { buildReport, changePct, reportText } from "utils/report";
import { CollectionItem, UserStats, WordItem } from "types";

const DAY = 86400000;
const NOW = 1_800_000_000_000;
const word = (id: string, source = id, over: Partial<WordItem> = {}): WordItem => ({ id, source, target: "nghĩa", ...over });
const deck = (name: string, words: WordItem[], over: Partial<CollectionItem> = {}): CollectionItem => ({ id: `id-${name}`, name, pathname: name.toLowerCase(), words, updatedAt: NOW - DAY, ...over });

describe("trash", () => {
  test("restoring a card puts it back at the front, stamped now, and asks to forget its tombstone", () => {
    const d = deck("A", [word("1"), word("2")]);
    const entries = trashWords([], d, [word("3", "three")], NOW);
    const r = restoreEntry([d], entries[0], NOW + 5);
    expect(r.error).toBeUndefined();
    expect(r.collections[0].words.map((w) => w.id)).toEqual(["3", "1", "2"]);
    expect(r.collections[0].words[0].addedAt).toBe(NOW + 5);
    expect(r.forget).toEqual({ word: `${deckKey(d)}::3` });
  });

  test("a restored card survives a merge with a device that still has the old deletion record", () => {
    const d = deck("A", [word("1")]);
    const gone = word("3", "three", { lastReviewed: NOW - 3 * DAY });
    const entry = trashWords([], d, [gone], NOW - DAY)[0];
    const restored = restoreEntry([d], entry, NOW).collections;
    const tombstones = { ...emptyTombstones(), words: { [wordTombstoneKey(deckKey(d), "3")]: NOW - DAY } };
    const merged = mergeCollections(restored, [], tombstones);
    expect(merged[0].words.map((w) => w.id)).toContain("3");
  });

  test("a card can't come back into a deck that is gone; the deck must be restored first", () => {
    const d = deck("A", [word("1")]);
    const wordEntry = trashWords([], d, [word("2")], NOW)[0];
    const r = restoreEntry([], wordEntry, NOW);
    expect(r.error).toContain("khôi phục bộ thẻ trước");
    expect(r.collections).toEqual([]);
  });

  test("restoring a deck renames it on a name clash and brings its cards", () => {
    const d = deck("A", [word("1"), word("2")]);
    const entry = trashDeck([], d, NOW)[0];
    const clash = deck("A", [], { id: "other", pathname: "a" });
    const r = restoreEntry([clash], entry, NOW);
    expect(r.collections[0].name).toBe("A (khôi phục)");
    expect(r.collections[0].words).toHaveLength(2);
    expect(r.collections[0].updatedAt).toBe(NOW);
    expect(r.forget).toEqual({ deck: "id-A" });
    expect(restoreEntry([d], entry, NOW).error).toContain("đã tồn tại");
  });

  test("restoring the same card twice doesn't duplicate it", () => {
    const d = deck("A", [word("1")]);
    const entry = trashWords([], d, [word("1")], NOW)[0];
    expect(restoreEntry([d], entry, NOW).collections[0].words).toHaveLength(1);
  });

  test("entries expire after 30 days and the trash is capped", () => {
    const d = deck("A", []);
    const old = trashWords([], d, [word("old")], NOW - (TRASH_DAYS + 1) * DAY);
    expect(pruneTrash(old, NOW)).toEqual([]);
    const many = trashWords([], d, Array.from({ length: MAX_TRASH + 50 }, (_, i) => word(`w${i}`)), NOW);
    expect(many).toHaveLength(MAX_TRASH);
    const e = trashWords([], d, [word("x")], NOW - 10 * DAY)[0];
    expect(daysLeft(e, NOW)).toBe(TRASH_DAYS - 10);
  });
});

describe("subtitles", () => {
  const srt = `1
00:00:01,000 --> 00:00:03,000
<i>Where were you</i>
last night?

2
00:00:03,500 --> 00:00:05,000
[door slams]
- I was at the market.

3
00:00:05,500 --> 00:00:06,000
♪ ♪

4
00:00:06,500 --> 00:00:08,000
I was at the market.
{\\an8}Really?`;

  test("keeps the dialogue as running text", () => {
    const text = subtitleToText(srt);
    expect(text).toBe("Where were you last night? I was at the market. Really?");
  });

  test("handles WebVTT headers and Windows line endings", () => {
    expect(subtitleToText("﻿WEBVTT\r\n\r\nNOTE a comment\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nHello <c.yellow>there</c>\r\n")).toBe("Hello there");
  });

  test("extracting from a very long text stays fast and keeps each word's own sentence", () => {
    const base = (w: string) => w;
    const name = (i: number) => "tok" + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + (Math.floor(i / 26) % 26)); // letters only: digits split words
    const text = Array.from({ length: 3000 }, (_, i) => `Sentence number ${i} uses ${name(i % 500)} here.`).join(" ");
    const t0 = Date.now();
    const out = extractCandidates(text, base);
    expect(Date.now() - t0).toBeLessThan(3000);
    const token = out.find((c) => c.word === name(7))!;
    expect(token.sentence).toMatch(/^Sentence number \d+ uses tokha here\.$/);
    expect(token.count).toBe(6); // i = 7, 507, ... 2507 (the text stays under the length limit)
  });
});

describe("xp and levels", () => {
  const stats = (over: Partial<UserStats> = {}): UserStats => ({ studyStreakDays: 1, lastStudyDate: "2026-03-10", totalCardsReviewed: 0, quizzesCompleted: 0, ...over });

  test("xp comes from reviews, study days and game coins", () => {
    const s = stats({ totalCardsReviewed: 50, reviewLog: { "2026-03-01": 20, "2026-03-02": 30, "2026-03-03": 0 }, games: { coins: 15, played: 3, best: {}, daily: {} } });
    expect(xpOf(s)).toBe(50 * 2 + 2 * 10 + 15);
    expect(xpOf(stats())).toBe(0);
  });

  test("level thresholds are 0, 100, 300, 600, 1000...", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
    expect(levelInfo(0)).toMatchObject({ level: 1, into: 0, needed: 100, pct: 0 });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(250)).toMatchObject({ level: 2, into: 150, needed: 200, pct: 75 });
    expect(levelInfo(-5).level).toBe(1);
    expect(levelInfo(1_000_000).level).toBeGreaterThan(50);
  });

  test("titles grow with level and stop at the last one", () => {
    expect(titleOf(1)).toBe("Người mới");
    expect(titleOf(4)).toBe("Học việc");
    expect(titleOf(999)).toBe("Huyền thoại");
  });
});

describe("report", () => {
  const now = new Date(2026, 2, 10, 12, 0, 0); // Tue 10 Mar 2026
  const log = {
    "2026-03-10": 25,
    "2026-03-09": 5,
    "2026-03-06": 40, // inside the week
    "2026-03-03": 12, // exactly 7 days before today: the previous week
    "2026-03-02": 8,
    "2026-02-20": 100 // earlier: only in the month
  };
  const stats: UserStats = { studyStreakDays: 4, lastStudyDate: "2026-03-10", totalCardsReviewed: 190, quizzesCompleted: 0, reviewLog: log, hourLog: { "21": [30, 25], "8": [5, 5] } };
  const cards: CollectionItem[] = [
    deck("A", [
      word("a", "apple", { lastReviewed: new Date(2026, 2, 9).getTime(), wrongCount: 4, status: "mastered", target: "(n.) quả táo; trái" }),
      word("b", "bad", { lastReviewed: new Date(2026, 2, 8).getTime(), wrongCount: 1 }),
      word("c", "old", { lastReviewed: new Date(2026, 1, 1).getTime(), wrongCount: 9 })
    ])
  ];

  test("week numbers", () => {
    const r = buildReport(stats, cards, "week", 20, now);
    expect(r).toMatchObject({ from: "2026-03-04", to: "2026-03-10", reviews: 70, previousReviews: 20, daysStudied: 3, goalDays: 2, averagePerStudyDay: 23, cardsTouched: 2, masteredTouched: 1, busiestHour: 21, streak: 4 });
    expect(r.bestDay).toEqual({ day: "2026-03-06", count: 40 });
    expect(r.hardWords.map((w) => w.source)).toEqual(["apple", "bad"]);
    expect(r.hardWords[0].meaning).toBe("quả táo");
    expect(changePct(r)).toBe(250);
  });

  test("month covers the whole window and has no comparison when the earlier period is empty", () => {
    const r = buildReport(stats, cards, "month", 20, now);
    expect(r.reviews).toBe(190);
    expect(changePct(r)).toBeNull();
    expect(r.hardWords.map((w) => w.source)).toEqual(["apple", "bad"]); // "old" was last reviewed before the 30-day window
  });

  test("an empty log gives a quiet report", () => {
    const r = buildReport({ ...stats, reviewLog: {}, hourLog: {} }, [], "week", 20, now);
    expect(r).toMatchObject({ reviews: 0, daysStudied: 0, bestDay: null, averagePerStudyDay: 0, busiestHour: null });
  });

  test("the shareable text mentions the key numbers", () => {
    const text = reportText(buildReport(stats, cards, "week", 20, now));
    expect(text).toContain("Tổng kết tuần (4/3 – 10/3)");
    expect(text).toContain("70 lượt ôn trong 3/7 ngày (+250% so với kỳ trước)");
    expect(text).toContain("Từ khó nhất: apple, bad");
  });
});
