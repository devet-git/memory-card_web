import { TOPICS, topicsOf } from "../data/grammar";
import { A1 } from "../data/grammar/a1";
import { A2 } from "../data/grammar/a2";
import { B1 } from "../data/grammar/b1";
import { B2 } from "../data/grammar/b2";
import { C1 } from "../data/grammar/c1";
import { C2 } from "../data/grammar/c2";
import { LEVELS, normalizeText, grade, answerText } from "utils/grammar";

// Structural checks on the lesson content: they can't prove the English is right, but they catch
// the mistakes that make an exercise impossible or broken (missing answer, two blanks, bad tiles...).

describe("grammar content", () => {
  test("every level has lessons and ids are unique and url-safe", () => {
    LEVELS.forEach((l) => expect(topicsOf(l).length).toBeGreaterThanOrEqual(6));
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9-]+$/));
    expect(A1.every((t) => t.level === "A1") && A2.every((t) => t.level === "A2") && B1.every((t) => t.level === "B1") && B2.every((t) => t.level === "B2") && C1.every((t) => t.level === "C1") && C2.every((t) => t.level === "C2")).toBe(true);
  });

  describe.each(TOPICS.map((t) => [t.id, t] as const))("%s", (_id, t) => {
    test("lesson text is complete", () => {
      expect(t.title.trim()).not.toBe("");
      expect(t.titleVi.trim()).not.toBe("");
      expect(t.summary.length).toBeGreaterThan(30);
      expect(t.rules.length).toBeGreaterThanOrEqual(2);
      t.rules.forEach((r) => {
        expect(r.title).toBeTruthy();
        expect(r.points.length).toBeGreaterThanOrEqual(1);
        r.points.forEach((p) => expect(p.trim().length).toBeGreaterThan(10));
      });
      expect(t.examples.length).toBeGreaterThanOrEqual(4);
      t.examples.forEach((e) => {
        expect(e.en.trim()).not.toBe("");
        expect(e.vi.trim()).not.toBe("");
      });
      expect(t.mistakes.length).toBeGreaterThanOrEqual(2);
      t.mistakes.forEach((m) => {
        expect(m.wrong).not.toBe(m.right);
        expect(m.why.length).toBeGreaterThan(10);
      });
    });

    test("has a good mix of exercises", () => {
      const count = (type: string) => t.exercises.filter((e) => e.type === type).length;
      expect(t.exercises.length).toBeGreaterThanOrEqual(9);
      expect(count("choice")).toBeGreaterThanOrEqual(4);
      expect(count("fill")).toBeGreaterThanOrEqual(3);
      expect(count("order")).toBeGreaterThanOrEqual(2);
      const prompts = t.exercises.map((e) => (e.type === "order" ? e.meaning : e.prompt));
      expect(new Set(prompts).size).toBe(prompts.length);
    });

    test("every exercise can be answered and has an explanation", () => {
      t.exercises.forEach((e) => {
        expect(e.explain.trim().length).toBeGreaterThan(5);
        if (e.type === "choice") {
          expect(e.options.length).toBeGreaterThanOrEqual(2);
          expect(e.options.length).toBeLessThanOrEqual(4);
          expect(new Set(e.options.map(normalizeText)).size).toBe(e.options.length);
          e.options.forEach((o) => expect(o.trim()).not.toBe(""));
          expect(Number.isInteger(e.answer) && e.answer >= 0 && e.answer < e.options.length).toBe(true);
          const blanks = e.prompt.split("___").length - 1;
          expect(blanks === 1 || /^Chọn câu đúng/.test(e.prompt)).toBe(true);
          expect(grade(e, e.answer)).toBe(true);
          expect(grade(e, (e.answer + 1) % e.options.length)).toBe(false);
        } else if (e.type === "fill") {
          expect(e.prompt.split("___").length - 1).toBe(1);
          expect(e.answers.length).toBeGreaterThanOrEqual(1);
          expect(new Set(e.answers.map(normalizeText)).size).toBe(e.answers.length);
          e.answers.forEach((a) => {
            expect(normalizeText(a)).not.toBe("");
            expect(grade(e, a)).toBe(true);
          });
          expect(grade(e, "")).toBe(false);
          expect(grade(e, "zzz qqq")).toBe(false);
        } else {
          expect(e.words.length).toBeGreaterThanOrEqual(3);
          expect(e.words.length).toBeLessThanOrEqual(12);
          expect(e.answers.length).toBeGreaterThanOrEqual(1);
          // the tiles, in order, form the first accepted sentence; every accepted sentence uses the same tiles
          const tiles = e.words.map(normalizeText).sort();
          e.answers.forEach((a) => {
            const words = a.replace(/[.!?]+$/, "").split(/\s+/).map(normalizeText).sort();
            expect(words).toEqual(tiles);
            expect(grade(e, a)).toBe(true);
          });
          expect(grade(e, e.words)).toBe(true);
          expect(grade(e, [...e.words].reverse())).toBe(e.words.join(" ") === [...e.words].reverse().join(" "));
        }
      });
    });

    test("showing the answer never gives an empty string", () => {
      t.exercises.forEach((e) => expect(answerText(e).trim()).not.toBe(""));
    });
  });
});

describe("order exercises", () => {
  test("every accepted sentence can really be built from the tiles shown (commas stay attached to their tile)", () => {
    let checked = 0;
    TOPICS.forEach((t) =>
      t.exercises.forEach((e, i) => {
        if (e.type !== "order") return;
        e.answers.forEach((a) => {
          const pool = e.words.map((w) => ({ w, used: false }));
          const sentenceWords = a.replace(/[.!?]+$/, "").split(/\s+/);
          const built = sentenceWords
            .map((word, wi) => {
              // a tile must match the word exactly (commas included); only the last word may lose its comma
              const exact = (p: { w: string; used: boolean }) => !p.used && p.w.toLowerCase() === word.toLowerCase();
              const loose = (p: { w: string; used: boolean }) => !p.used && normalizeText(p.w.replace(/[,.;:]$/, "")) === normalizeText(word.replace(/[,.;:]$/, ""));
              const tile = pool.find(exact) || (wi === sentenceWords.length - 1 ? pool.find(loose) : undefined);
              if (!tile) throw new Error(`${t.id}[${i}]: no tile for "${word}" in "${a}"`);
              tile.used = true;
              return tile.w;
            });
          expect(grade(e, built)).toBe(true);
          checked++;
        });
      })
    );
    expect(checked).toBeGreaterThan(80); // one per order exercise plus the extra accepted sentences
  });
});

describe("totals", () => {
  test("size of the course", () => {
    const exercises = TOPICS.reduce((a, t) => a + t.exercises.length, 0);
    expect(TOPICS.length).toBeGreaterThanOrEqual(46);
    expect(exercises).toBeGreaterThanOrEqual(450);
  });
});
