import {
  choice,
  fill,
  order,
  normalizeText,
  grade,
  answerText,
  shuffleChoice,
  topicSession,
  reviewSession,
  topicStatus,
  reviewAfterDays,
  applyGrammarResult,
  mergeGrammar,
  dueTopics,
  masteredCount,
  exerciseId,
  GrammarTopic,
  SESSION_SIZE
} from "utils/grammar";
import { mergeStats } from "utils/merge";
import { computeBadges } from "utils/badges";
import { GrammarProgress, UserStats } from "types";

const DAY = 86400000;
const NOW = new Date(2026, 5, 10, 10, 0, 0);
const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const topic = (id: string, n = 12): GrammarTopic => ({
  id,
  level: "A1",
  title: id,
  titleVi: id,
  summary: "x",
  rules: [],
  examples: [],
  mistakes: [],
  exercises: Array.from({ length: n }, (_, i) => fill(`Q${i} ___`, [`a${i}`], "because"))
});
const stats = (over: Partial<UserStats> = {}): UserStats => ({ studyStreakDays: 1, lastStudyDate: "2026-06-09", totalCardsReviewed: 0, quizzesCompleted: 0, ...over });
const prog = (over: Partial<GrammarProgress> = {}): GrammarProgress => ({ best: 90, last: 90, attempts: 1, lastAt: NOW.getTime(), wrong: [], ...over });

describe("grading", () => {
  test("normalizeText ignores case, curly quotes, spacing and end punctuation", () => {
    expect(normalizeText("  Isn’t   it. ")).toBe("isn't it");
    expect(normalizeText("Hello!")).toBe("hello");
    expect(normalizeText("...")).toBe("");
  });

  test("choice, fill and order", () => {
    const ch = choice("x ___", ["a", "b", "c"], 1, "e");
    expect(grade(ch, 1)).toBe(true);
    expect(grade(ch, 0)).toBe(false);
    expect(answerText(ch)).toBe("b");

    const fi = fill("x ___", ["isn't", "is not"], "e");
    expect(grade(fi, "Isn’t")).toBe(true);
    expect(grade(fi, " is not. ")).toBe(true);
    expect(grade(fi, "is")).toBe(false);
    expect(answerText(fi)).toBe("isn't");

    const or = order("vi", "She works in a bank.", "e");
    expect(or.words).toEqual(["she", "works", "in", "a", "bank"]);
    expect(grade(or, ["she", "works", "in", "a", "bank"])).toBe(true);
    expect(grade(or, "She works in a bank")).toBe(true);
    expect(grade(or, ["works", "she", "in", "a", "bank"])).toBe(false);
    expect(answerText(or)).toBe("She works in a bank.");
  });

  test("order keeps I capitalised and strips only the final punctuation", () => {
    expect(order("vi", "I am a student.", "e").words[0]).toBe("I");
    expect(order("vi", "I'm happy.", "e").words[0]).toBe("I'm");
    expect(order("vi", "However, she is late.", "e").words).toEqual(["however,", "she", "is", "late"]);
  });

  test("shuffleChoice moves the answer with its option", () => {
    const ch = choice("x ___", ["a", "b", "c", "d"], 2, "e");
    for (const r of [[0.1, 0.9, 0.5], [0.99, 0.2, 0.6]]) {
      const s = shuffleChoice(ch, seq(r));
      expect([...s.options].sort()).toEqual(["a", "b", "c", "d"]);
      expect(s.options[s.answer]).toBe("c");
    }
  });
});

describe("sessions", () => {
  test("a topic session has at most 10 distinct exercises and puts missed ones first", () => {
    const t = topic("t", 15);
    const wrong = [exerciseId("t", 3), exerciseId("t", 14)];
    const s = topicSession(t, wrong, SESSION_SIZE, seq([0.3, 0.8, 0.1]));
    expect(s).toHaveLength(SESSION_SIZE);
    expect(new Set(s.map((x) => x.id)).size).toBe(SESSION_SIZE);
    expect(s.map((x) => x.id)).toEqual(expect.arrayContaining(wrong));
    expect(topicSession(topic("small", 4))).toHaveLength(4);
  });

  test("review session: missed exercises first, then due topics, nothing twice", () => {
    const a = topic("a");
    const b = topic("b");
    const c = topic("c");
    const progress = {
      a: prog({ last: 60, lastAt: NOW.getTime() - 3 * DAY, wrong: [exerciseId("a", 1), exerciseId("a", 2)] }), // due and has misses
      b: prog({ last: 95, lastAt: NOW.getTime() - 8 * DAY }), // due
      c: prog({ last: 95, lastAt: NOW.getTime() - 1 * DAY }) // not due
    };
    const s = reviewSession([a, b, c], progress, SESSION_SIZE, NOW.getTime(), seq([0.4, 0.7]));
    const ids = s.map((x) => x.id);
    expect(ids).toHaveLength(SESSION_SIZE);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([exerciseId("a", 1), exerciseId("a", 2)]));
    expect(s.some((x) => x.topic.id === "b")).toBe(true);
    expect(s.some((x) => x.topic.id === "c")).toBe(false);
    expect(reviewSession([a], {}, SESSION_SIZE, NOW.getTime())).toEqual([]);
  });
});

describe("progress", () => {
  test("status follows the last score and the review interval", () => {
    const now = NOW.getTime();
    expect(topicStatus(undefined, now)).toBe("new");
    expect(topicStatus(prog({ best: 100, last: 100, lastAt: now - 2 * DAY }), now)).toBe("mastered");
    expect(topicStatus(prog({ best: 100, last: 100, lastAt: now - 8 * DAY }), now)).toBe("due");
    expect(topicStatus(prog({ best: 60, last: 60, lastAt: now - 0.5 * DAY }), now)).toBe("learning");
    expect(topicStatus(prog({ best: 60, last: 60, lastAt: now - 2 * DAY }), now)).toBe("due");
    expect([95, 85, 50].map(reviewAfterDays)).toEqual([7, 3, 1]);
  });

  test("applyGrammarResult records scores, keeps bests, tracks missed ids and counts study actions", () => {
    const first = applyGrammarResult(
      stats(),
      { items: [{ id: "t:0", topicId: "t", correct: true }, { id: "t:1", topicId: "t", correct: false }, { id: "t:2", topicId: "t", correct: true }, { id: "t:3", topicId: "t", correct: true }] },
      NOW
    );
    expect(first.grammar!.t).toMatchObject({ best: 75, last: 75, attempts: 1, wrong: ["t:1"] });
    expect(first.totalCardsReviewed).toBe(4);
    expect(first.reviewLog!["2026-06-10"]).toBe(4);
    expect(first.studyStreakDays).toBe(2);

    const second = applyGrammarResult(first, { items: [{ id: "t:1", topicId: "t", correct: true }, { id: "t:5", topicId: "t", correct: false }] }, new Date(NOW.getTime() + 1000));
    expect(second.grammar!.t.last).toBe(50);
    expect(second.grammar!.t.best).toBe(75);
    expect(second.grammar!.t.attempts).toBe(2);
    expect(second.grammar!.t.wrong).toEqual(["t:5"]); // t:1 was answered right this time
    expect(second.totalCardsReviewed).toBe(6);
  });

  test("a mixed review updates every topic it touched", () => {
    const r = applyGrammarResult(stats(), { items: [{ id: "a:0", topicId: "a", correct: true }, { id: "b:0", topicId: "b", correct: false }] }, NOW);
    expect(r.grammar!.a.best).toBe(100);
    expect(r.grammar!.b).toMatchObject({ best: 0, wrong: ["b:0"] });
  });

  test("merging devices: bests grow, the newer session decides the rest", () => {
    const a = { t: prog({ best: 90, last: 70, attempts: 3, lastAt: 100, wrong: ["t:1"] }), only: prog({ best: 50 }) };
    const b = { t: prog({ best: 80, last: 100, attempts: 2, lastAt: 200, wrong: [] }), other: prog({ best: 60 }) };
    const m = mergeGrammar(a, b)!;
    expect(m.t).toEqual({ best: 90, last: 100, attempts: 3, lastAt: 200, wrong: [] });
    expect(Object.keys(m).sort()).toEqual(["only", "other", "t"]);
    expect(mergeGrammar(undefined, undefined)).toBeUndefined();
    expect(mergeStats(stats({ grammar: a }), { grammar: b, lastStudyDate: "2026-06-01" }).grammar!.t.best).toBe(90);
  });

  test("dueTopics lists topics whose review date came, most overdue first; mastered count; badges", () => {
    const now = NOW.getTime();
    const topics = [topic("x"), topic("y"), topic("z")];
    const progress = { x: prog({ last: 95, lastAt: now - 9 * DAY }), y: prog({ last: 95, lastAt: now - 20 * DAY }), z: prog({ last: 95, lastAt: now }) };
    expect(dueTopics(topics, progress, now).map((t) => t.id)).toEqual(["y", "x"]);
    expect(masteredCount(progress)).toBe(3);
    expect(masteredCount(undefined)).toBe(0);
    const many = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`t${i}`, prog()]));
    expect(computeBadges(stats({ grammar: many }), []).filter((b) => b.earned).map((b) => b.id)).toContain("grammar5");
  });
});
