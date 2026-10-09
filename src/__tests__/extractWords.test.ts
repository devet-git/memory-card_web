import { extractCandidates, splitSentences, tokenize } from "utils/extractWords";
import { findUsedWords, pickTargetWords, buildTurnPrompt, HISTORY_WINDOW } from "utils/roleplay";
import { WordItem } from "types";

const base = (w: string) => ({ went: "go", going: "go", gone: "go", cities: "city" } as Record<string, string>)[w] || w;

describe("extractCandidates", () => {
  const text = "She went to the market. Going there was fun! The market's cities are old.\nI have gone twice.";

  test("tokenizes English words and drops possessives and short words", () => {
    expect(tokenize("It's the market's best").map((t) => t.token)).toEqual(["the", "market", "best"]);
  });

  test("splits sentences with offsets", () => {
    const s = splitSentences("Hi there. How are you?\nFine!");
    expect(s.map((x) => x.text)).toEqual(["Hi there.", "How are you?", "Fine!"]);
    expect(s[1].start).toBe(10);
  });

  test("groups inflected forms, skips stopwords and known words, and keeps the source sentence", () => {
    const list = extractCandidates(text, base, new Set(["market"]));
    const go = list.find((c) => c.word === "go")!;
    expect(go.count).toBe(3);
    expect(go.forms.sort()).toEqual(["going", "gone", "went"]);
    expect(go.sentence).toBe("She went to the market.");
    expect(list.find((c) => c.word === "market")).toBeUndefined();
    expect(list.find((c) => c.word === "the")).toBeUndefined();
    expect(list.map((c) => c.word)).toContain("city");
    expect(list[0].word).toBe("go"); // most frequent first
  });

  test("ignores a word's base form when the learner already has it", () => {
    expect(extractCandidates("They went home", base, new Set(["go"])).map((c) => c.word)).toEqual(["home"]);
  });
});

describe("roleplay helpers", () => {
  const w = (source: string, extra: Partial<WordItem> = {}): WordItem => ({ id: source, source, target: "x", ...extra });

  test("findUsedWords matches inflections and phrases", () => {
    const targets = [w("go"), w("look forward to"), w("apple")];
    const found = findUsedWords("Yesterday I went home and I look forward to seeing you.", targets, base).map((x) => x.source);
    expect(found).toEqual(["go", "look forward to"]);
  });

  test("findUsedWords does not match partial words", () => {
    expect(findUsedWords("The category is great", [w("cat")], base)).toEqual([]);
  });

  test("pickTargetWords puts struggling cards first and respects the limit", () => {
    const words = [w("a"), w("b", { wrongCount: 3 }), w("c"), w("d", { lapses: 5 }), w("e")];
    const picked = pickTargetWords(words, 3, () => 0.5).map((x) => x.source);
    expect(picked).toHaveLength(3);
    expect(picked.slice(0, 2).sort()).toEqual(["b", "d"]);
  });

  test("buildTurnPrompt only sends the recent history", () => {
    const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? ("user" as const) : ("ai" as const), text: `m${i}` }));
    const prompt = buildTurnPrompt(history, "hello");
    expect(prompt).not.toContain("m0");
    expect(prompt).toContain("m29");
    expect(prompt.split("\n").length).toBe(HISTORY_WINDOW + 2);
    expect(buildTurnPrompt([])).toContain("Start the role-play");
  });
});
