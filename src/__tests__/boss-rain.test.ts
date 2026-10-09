import { pickBosses, minionQuestion, bossQuestion, isCorrect, battleScore, battleCoins, bossEmoji, BOSS_HP } from "utils/boss";
import { newRain, stepRain, matchDrop, levelOf, fallSeconds, spawnGap, rainWords, rainPoints, rainCoins, MAX_DROPS, Drop } from "utils/wordRain";
import { WordItem } from "types";

const word = (id: string, source: string, target: string, over: Partial<WordItem> = {}): WordItem => ({ id, source, target, ...over });
const pool = [
  word("a", "cat", "mèo"),
  word("b", "dog", "chó"),
  word("c", "house", "ngôi nhà"),
  word("d", "water", "nước"),
  word("e", "ephemeral", "phù du; ngắn ngủi", { wrongCount: 8, lapses: 5 }),
  word("f", "table", "cái bàn", { wrongCount: 2 })
];
const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("boss battle", () => {
  test("pickBosses puts leeches first, then the most-missed cards, and skips untouched ones", () => {
    const list = pickBosses(pool);
    expect(list.map((b) => b.word.id)).toEqual(["e", "f"]);
    expect(list[0].leech).toBe(true);
    expect(list[1].leech).toBe(false);
    expect(pickBosses([word("x", "a", "b")])).toEqual([]);
    expect(pickBosses(pool, 1)).toHaveLength(1);
  });

  test("minion question is a 4-way meaning choice containing the answer once", () => {
    const q = minionQuestion(pool[0], pool, seq([0.2, 0.7, 0.4]));
    expect(q.kind).toBe("choice");
    if (q.kind !== "choice") return;
    expect(q.question).toBe("cat");
    expect(q.answer).toBe("mèo");
    expect(q.options).toHaveLength(4);
    expect(q.options.filter((o) => o === "mèo")).toHaveLength(1);
    expect(new Set(q.options).size).toBe(4);
  });

  test("the boss is asked three different ways", () => {
    const boss = pool[4];
    const [p0, p1, p2] = [0, 1, 2].map((i) => bossQuestion(i, boss, pool, seq([0.3, 0.6])));
    expect(p0).toMatchObject({ kind: "choice", question: "ephemeral", answer: "phù du" });
    expect(p1).toMatchObject({ kind: "choice", question: "phù du", answer: "ephemeral" });
    expect(p2).toMatchObject({ kind: "type", question: "phù du", answer: "ephemeral" });
    if (p1.kind === "choice") expect(p1.options).toContain("ephemeral");
    if (p2.kind === "type") expect(p2.hint).toContain("9 chữ cái");
    expect(BOSS_HP).toBe(3);
  });

  test("typed answers ignore case, accents and punctuation; choices must match exactly", () => {
    const typed = bossQuestion(2, pool[4], pool);
    expect(isCorrect(typed, " Ephemeral ")).toBe(true);
    expect(isCorrect(typed, "ephemera")).toBe(false);
    const choice = bossQuestion(0, pool[4], pool);
    expect(isCorrect(choice, "phù du")).toBe(true);
    expect(isCorrect(choice, "Phù du")).toBe(false);
  });

  test("a win is worth more than a narrow loss; hearts add to both", () => {
    const win = { won: true, heartsLeft: 3, minionsDefeated: 3, bossDamage: 3 };
    const loss = { won: false, heartsLeft: 0, minionsDefeated: 3, bossDamage: 2 };
    expect(battleScore(win)).toBeGreaterThan(battleScore(loss));
    expect(battleCoins(win)).toBe(14);
    expect(battleCoins(loss)).toBe(Math.floor(battleScore(loss) / 40));
    expect(battleCoins({ ...win, heartsLeft: 5 })).toBeGreaterThan(battleCoins(win));
  });

  test("each card keeps the same emoji", () => {
    expect(bossEmoji(pool[4])).toBe(bossEmoji(pool[4]));
  });
});

describe("word rain", () => {
  const rng = () => 0.5;

  test("difficulty ramps up with the number of cleared words", () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(8)).toBe(2);
    expect(fallSeconds(5)).toBeLessThan(fallSeconds(1));
    expect(fallSeconds(99)).toBeGreaterThanOrEqual(5);
    expect(spawnGap(6)).toBeLessThan(spawnGap(1));
    expect(spawnGap(99)).toBeGreaterThanOrEqual(1.2);
  });

  test("the first step spawns a drop at the top", () => {
    const { state, lost } = stepRain(newRain(), 0.5, pool, rng);
    expect(state.drops).toHaveLength(1);
    expect(state.drops[0].y).toBe(0);
    expect(state.drops[0].x).toBeGreaterThanOrEqual(0);
    expect(state.drops[0].x).toBeLessThanOrEqual(100);
    expect(lost).toEqual([]);
  });

  test("drops fall, and the ones reaching the bottom are reported lost", () => {
    let state = stepRain(newRain(), 0.5, pool, rng).state;
    const id = state.drops[0].word.id;
    let lostIds: (string | number)[] = [];
    for (let t = 0; t < 40 && lostIds.length === 0; t++) {
      const r = stepRain(state, 1, [], rng); // empty pool: no new spawns
      state = r.state;
      lostIds = r.lost.map((d) => d.word.id);
    }
    expect(lostIds).toEqual([id]);
    expect(state.drops).toHaveLength(0);
  });

  test("never more than MAX_DROPS and never the same word twice on screen", () => {
    let state = newRain();
    for (let i = 0; i < 200; i++) {
      state = stepRain(state, 0.05, pool, seq([0.1, 0.5, 0.9, 0.3])).state;
      state = { ...state, nextSpawn: 0 }; // force spawning every step
      expect(state.drops.length).toBeLessThanOrEqual(MAX_DROPS);
      const ids = state.drops.map((d) => String(d.word.id));
      expect(new Set(ids).size).toBe(ids.length);
      // keep drops alive for the test
      state = { ...state, drops: state.drops.map((d) => ({ ...d, y: Math.min(d.y, 0.5) })) };
    }
  });

  test("stepRain doesn't mutate the previous state", () => {
    const base = { ...newRain(), queue: [...pool], nextSpawn: 0 };
    const snapshot = JSON.stringify(base);
    stepRain(base, 0.1, pool, rng);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  describe("matchDrop", () => {
    const drop = (uid: number, w: WordItem, y: number): Drop => ({ uid, word: w, x: 0, y, speed: 0.1 });
    const drops = [drop(1, word("1", "cat", "mèo"), 0.2), drop(2, word("2", "category", "loại"), 0.4)];

    test("waits when a longer falling word starts with the typed text, unless forced", () => {
      expect(matchDrop(drops, "cat")).toBeNull();
      expect(matchDrop(drops, "cat", true)?.word.id).toBe("1");
      expect(matchDrop(drops, "category")?.word.id).toBe("2");
    });

    test("ignores case and accents, and prefers the lowest drop", () => {
      const twin = [drop(1, word("1", "Café", "cà phê"), 0.2), drop(2, word("2", "cafe", "quán"), 0.7)];
      expect(matchDrop(twin, " CAFE ")?.word.id).toBe("2");
      expect(matchDrop(twin, "")).toBeNull();
      expect(matchDrop(twin, "tea")).toBeNull();
    });
  });

  test("scoring and eligible words", () => {
    expect(rainPoints(word("x", "cat", "mèo"), 0)).toBe(16);
    expect(rainPoints(word("x", "cat", "mèo"), 10)).toBe(48);
    expect(rainCoins(130)).toBe(5);
    const list = [word("1", "a", "x"), word("2", "extraordinarily-long", "y"), word("3", "ok", "z"), word("4", "fine", "")];
    expect(rainWords(list).map((w) => w.id)).toEqual(["3"]);
  });
});

import { hardness, floorKind, sortByHardness, pickFloorWord, floorQuestion, floorPoints, towerCoins } from "utils/tower";

describe("tower climb", () => {
  const cards = [
    word("easy", "cat", "mèo"),
    word("mid", "table", "cái bàn", { wrongCount: 1 }),
    word("hard", "ephemeral", "phù du", { wrongCount: 6, lapses: 4, difficulty: 9 }),
    word("m2", "house", "ngôi nhà", { difficulty: 4 }),
    word("m3", "water", "nước"),
    word("m4", "green", "màu xanh lá", { wrongCount: 2 }),
    word("m5", "dog", "chó", { difficulty: 3 })
  ];

  test("hardness grows with misses, lapses and FSRS difficulty", () => {
    expect(hardness(cards[2])).toBeGreaterThan(hardness(cards[1]));
    expect(hardness(cards[1])).toBeGreaterThan(hardness(cards[0]));
  });

  test("question types rotate by floor", () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10].map(floorKind)).toEqual(["meaning", "meaning", "term", "meaning", "typing", "term", "term", "typing"]);
  });

  test("cards are sorted easiest first", () => {
    const sorted = sortByHardness(cards, seq([0.5]));
    expect(sorted[sorted.length - 1].id).toBe("hard");
    expect(sorted.map(hardness)).toEqual([...sorted.map(hardness)].sort((a, b) => a - b));
  });

  test("higher floors draw harder cards on average, without repeating a card", () => {
    const sorted = sortByHardness(cards, seq([0.5]));
    const avg = (floor: number) => {
      const picks = Array.from({ length: 40 }, () => hardness(pickFloorWord(sorted, floor, new Set(), seq([0.3, 0.7, 0.1, 0.9]))));
      return picks.reduce((a, b) => a + b, 0) / picks.length;
    };
    expect(avg(28)).toBeGreaterThan(avg(1));

    const used = new Set<string>();
    const seen = Array.from({ length: cards.length }, (_, i) => pickFloorWord(sorted, i + 1, used).id);
    expect(new Set(seen).size).toBe(cards.length);
    // once every card was used the climb continues instead of getting stuck
    expect(() => pickFloorWord(sorted, 8, used)).not.toThrow();
    expect(used.size).toBe(1);
  });

  test("floor questions carry the floor label and the matching style", () => {
    expect(floorQuestion(1, cards[0], cards)).toMatchObject({ kind: "choice", label: "Tầng 1", question: "cat" });
    expect(floorQuestion(3, cards[0], cards)).toMatchObject({ kind: "choice", label: "Tầng 3", answer: "cat" });
    expect(floorQuestion(5, cards[0], cards)).toMatchObject({ kind: "type", label: "Tầng 5", answer: "cat" });
  });

  test("points and coins scale with height", () => {
    expect(floorPoints(10)).toBeGreaterThan(floorPoints(1));
    expect(towerCoins(95)).toBe(4);
  });
});
