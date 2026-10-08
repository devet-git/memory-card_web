import { WordItem } from "types";

// Tiny in-memory dictionary served through a fake fetch, in the real shard format:
// word -> [ipa, pos, def, example, rank, lemma, vi]
const SHARDS: Record<string, Record<string, unknown[]>> = {
  go: { go: ["ɡoʊ", "v", "move from one place to another", "Let's go", 80, "", "đi"], goal: ["ɡoʊl", "n", "the object of an effort", "", 900, "", "mục tiêu"], good: ["ɡʊd", "a", "having desirable qualities", "", 100, "", "tốt"] },
  we: { went: ["wɛnt", "", "", "", 242, "go", ""], we: ["wi", "", "", "", 20, "", "chúng tôi"] },
  ap: { apple: ["ˈæpəl", "n", "fruit", "", 2500, "", "táo"], apply: ["əˈplaɪ", "v", "put to use", "", 1500, "", "áp dụng"], apple_: [] }
};
delete SHARDS.ap.apple_;

beforeEach(() => {
  jest.resetModules();
  (global as any).fetch = jest.fn(async (url: string) => {
    const name = url.split("/").pop()!.replace(".json", "");
    if (name === "meta") return { ok: true, json: async () => ({ shards: Object.keys(SHARDS) }) };
    if (SHARDS[name]) return { ok: true, json: async () => SHARDS[name] };
    return { ok: false, json: async () => ({}) };
  });
});

const load = () => require("utils/localDict") as typeof import("utils/localDict");

describe("localDict", () => {
  test("lookupLocal finds a word case-insensitively and parses the fields", async () => {
    const { lookupLocal } = load();
    const e = await lookupLocal("  GO ");
    expect(e).toMatchObject({ word: "go", ipa: "ɡoʊ", pos: "v", vi: "đi", rank: 80, lemma: "" });
    expect(await lookupLocal("zzzz")).toBeNull();
    expect(await lookupLocal("a")).toBeNull();
  });

  test("an unknown shard is never fetched", async () => {
    const { lookupLocal } = load();
    await lookupLocal("xylophone");
    const calls = (global as any).fetch.mock.calls.map((c: string[]) => c[0]);
    expect(calls.some((u: string) => u.endsWith("/xy.json"))).toBe(false);
  });

  test("lookupBest falls back to the base form for inflected words", async () => {
    const { lookupBest } = load();
    const best = await lookupBest("went");
    expect(best).toMatchObject({ vi: "đi", def: "move from one place to another", base: "go" });
  });

  test("suggestWords completes a prefix, most common first", async () => {
    const { suggestWords } = load();
    const out = await suggestWords("go", 5);
    expect(out.map((e) => e.word)).toEqual(["go", "good", "goal"]);
    expect(await suggestWords("g")).toEqual([]);
  });

  test("suggestSpelling proposes close words for a typo", async () => {
    const { suggestSpelling } = load();
    const out = await suggestSpelling("aple");
    expect(out.map((e) => e.word)).toContain("apple");
  });

  test("baseFormSync works after prefetch only", async () => {
    const { baseFormSync, prefetch } = load();
    expect(baseFormSync("went")).toBe("went");
    await prefetch(["went"]);
    expect(baseFormSync("went")).toBe("go");
    expect(baseFormSync("we")).toBe("we");
  });

  test("formatPos and rankTier", () => {
    const { formatPos, rankTier } = load();
    expect(formatPos("na")).toBe("n. / adj.");
    expect(rankTier(100)).toBe("Rất phổ biến");
    expect(rankTier(0)).toBe("");
  });
});

describe("buildCloze (uses the dictionary for inflections)", () => {
  const word = (source: string, example: string): WordItem => ({ id: source, source, target: "x", example });

  test("blanks an exact match, keeping the sentence's own form", async () => {
    const { buildCloze } = require("components/study/Cloze") as typeof import("components/study/Cloze");
    expect(buildCloze(word("apple", "I ate an apple today."))).toMatchObject({ text: "I ate an _____ today.", answer: "apple" });
  });

  test("blanks a multi-word phrase", async () => {
    const { buildCloze } = require("components/study/Cloze") as typeof import("components/study/Cloze");
    expect(buildCloze(word("look up", "Please look up the word."))?.text).toBe("Please _____ the word.");
  });

  test("matches an inflected form once shards are loaded", async () => {
    const { buildCloze, clozeVocabulary } = require("components/study/Cloze") as typeof import("components/study/Cloze");
    const { prefetch } = require("utils/localDict") as typeof import("utils/localDict");
    const w = word("go", "She went home early.");
    expect(buildCloze(w)).toBeNull(); // before the dictionary is loaded
    await prefetch(clozeVocabulary(w));
    expect(buildCloze(w)).toMatchObject({ text: "She _____ home early.", answer: "went" });
  });

  test("returns null when the term is absent or there is no example", () => {
    const { buildCloze } = require("components/study/Cloze") as typeof import("components/study/Cloze");
    expect(buildCloze(word("apple", "Nothing here."))).toBeNull();
    expect(buildCloze({ id: 1, source: "apple", target: "táo" })).toBeNull();
  });
});
