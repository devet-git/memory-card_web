import { GrammarProgress, UserStats } from "types";
import { recordStudy } from "utils/streak";

// Grammar lessons: types, grading and progress. The lesson content lives in src/data/grammar
// and is only loaded by the grammar pages, so nothing here imports it.

export type GLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const LEVELS: GLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LEVEL_NAMES: Record<GLevel, string> = { A1: "Sơ cấp", A2: "Cơ bản", B1: "Trung cấp", B2: "Trung cao cấp", C1: "Nâng cao", C2: "Thành thạo" };

interface ExerciseBase {
  explain: string; // why the answer is right (Vietnamese), shown after answering
}
export interface ChoiceEx extends ExerciseBase {
  type: "choice";
  prompt: string; // a sentence with ___ , or a question
  options: string[];
  answer: number; // index in options
}
export interface FillEx extends ExerciseBase {
  type: "fill";
  prompt: string; // sentence with ___
  answers: string[]; // accepted answers
  hint?: string; // e.g. the base verb in brackets
}
export interface OrderEx extends ExerciseBase {
  type: "order";
  meaning: string; // the sentence in Vietnamese
  words: string[]; // the words to arrange, in the correct order (shuffled when shown)
  answers: string[]; // accepted sentences (the first is shown as the answer)
}
export type Exercise = ChoiceEx | FillEx | OrderEx;

export interface ExampleSentence {
  en: string;
  vi: string;
}
export interface Mistake {
  wrong: string;
  right: string;
  why: string;
}
export interface RuleBlock {
  title: string;
  points: string[];
}
export interface GrammarTopic {
  id: string;
  level: GLevel;
  title: string; // English name
  titleVi: string;
  summary: string; // one or two sentences, Vietnamese
  rules: RuleBlock[];
  examples: ExampleSentence[];
  mistakes: Mistake[];
  exercises: Exercise[];
}

// ---------- authoring helpers (keep the data files short) ----------

export const choice = (prompt: string, options: string[], answer: number, explain: string): ChoiceEx => ({ type: "choice", prompt, options, answer, explain });
export const fill = (prompt: string, answers: string[], explain: string, hint?: string): FillEx => ({ type: "fill", prompt, answers, explain, ...(hint ? { hint } : {}) });

/** `sentence` is the correct sentence; its words (without the final punctuation) become the tiles. */
export const order = (meaning: string, sentence: string, explain: string, alternatives: string[] = []): OrderEx => {
  const words = sentence
    .replace(/[.!?]+$/, "")
    .split(/\s+/)
    .map((w, i) => (i === 0 && w !== "I" && !/^I['’]/.test(w) && !/^[A-Z]{2,}/.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w));
  return { type: "order", meaning, words, answers: [sentence, ...alternatives], explain };
};

// ---------- grading ----------

/** Case, curly quotes, spacing and end punctuation don't matter. */
export const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, "")
    .trim();

export type Response = number | string | string[];

export function grade(ex: Exercise, response: Response): boolean {
  if (ex.type === "choice") return response === ex.answer;
  if (ex.type === "fill") return typeof response === "string" && ex.answers.some((a) => normalizeText(a) === normalizeText(response));
  const sentence = Array.isArray(response) ? response.join(" ") : String(response);
  return ex.answers.some((a) => normalizeText(a) === normalizeText(sentence));
}

/** The answer in words, for showing after a miss. */
export const answerText = (ex: Exercise): string => (ex.type === "choice" ? ex.options[ex.answer] : ex.answers[0]);

/** A copy of a multiple-choice exercise with its options in random order (the answer index follows). */
export function shuffleChoice(ex: ChoiceEx, rng: () => number = Math.random): ChoiceEx {
  const idx = ex.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...ex, options: idx.map((i) => ex.options[i]), answer: idx.indexOf(ex.answer) };
}

/** The exercise as a finished sentence, for the review list after a session. */
export function solvedSentence(ex: Exercise): string {
  if (ex.type === "order") return ex.answers[0];
  const filler = ex.type === "choice" ? ex.options[ex.answer] : ex.answers[0];
  return ex.prompt.includes("___") ? ex.prompt.replace("___", filler).replace(/\s*\([^)]*\)\s*$/, "") : `${ex.prompt} → ${filler}`;
}

// ---------- sessions ----------

export const SESSION_SIZE = 10;
export const MASTERED_SCORE = 80;

export const exerciseId = (topicId: string, index: number) => `${topicId}:${index}`;

export interface SessionItem {
  id: string;
  topic: GrammarTopic;
  exercise: Exercise;
}

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A practice session for one topic: exercises missed before come first, then the rest, in random order. */
export function topicSession(topic: GrammarTopic, wrongIds: string[] = [], size = SESSION_SIZE, rng: () => number = Math.random): SessionItem[] {
  const all = topic.exercises.map((exercise, i) => ({ id: exerciseId(topic.id, i), topic, exercise }));
  const missed = all.filter((x) => wrongIds.includes(x.id));
  const rest = all.filter((x) => !wrongIds.includes(x.id));
  return shuffle([...shuffle(missed, rng), ...shuffle(rest, rng)].slice(0, size), rng);
}

// ---------- progress ----------

const DAY_MS = 86400000;

/** Days before a topic should be practised again, from the score of its last session. */
export const reviewAfterDays = (score: number) => (score >= 90 ? 7 : score >= MASTERED_SCORE ? 3 : 1);

export type TopicStatus = "new" | "learning" | "mastered" | "due";

export function topicStatus(p: GrammarProgress | undefined, now = Date.now()): TopicStatus {
  if (!p || p.attempts === 0) return "new";
  if (now - p.lastAt >= reviewAfterDays(p.last) * DAY_MS) return "due";
  return p.best >= MASTERED_SCORE ? "mastered" : "learning";
}

export const masteredCount = (progress: Record<string, GrammarProgress> | undefined) => Object.values(progress || {}).filter((p) => p.best >= MASTERED_SCORE).length;

export interface SessionResult {
  items: { id: string; topicId: string; correct: boolean }[];
}

/**
 * Records a finished session: per-topic score, best, attempts and the ids still wrong, and counts every
 * exercise as a study action (so grammar practice keeps the streak and earns XP like card reviews).
 */
export function applyGrammarResult(stats: UserStats, result: SessionResult, now: Date = new Date()): UserStats {
  const byTopic = new Map<string, { id: string; correct: boolean }[]>();
  result.items.forEach((it) => byTopic.set(it.topicId, [...(byTopic.get(it.topicId) || []), it]));

  const grammar = { ...(stats.grammar || {}) };
  byTopic.forEach((items, topicId) => {
    const prev = grammar[topicId];
    const score = Math.round((items.filter((i) => i.correct).length / items.length) * 100);
    const answered = new Set(items.map((i) => i.id));
    const stillWrong = items.filter((i) => !i.correct).map((i) => i.id);
    // an exercise answered right now is no longer "wrong"; the ones not in this session keep their mark
    const wrong = Array.from(new Set([...(prev?.wrong || []).filter((id) => !answered.has(id)), ...stillWrong]));
    grammar[topicId] = { best: Math.max(prev?.best || 0, score), last: score, attempts: (prev?.attempts || 0) + 1, lastAt: now.getTime(), wrong };
  });

  let next: UserStats = { ...stats, grammar };
  result.items.forEach((it) => {
    next = recordStudy(next, it.correct, now);
  });
  return next;
}

/** Union of two devices' progress: the newer session decides "last" and the wrong list, bests only grow. */
export function mergeGrammar(a: Record<string, GrammarProgress> | undefined, b: Record<string, GrammarProgress> | undefined): Record<string, GrammarProgress> | undefined {
  if (!a && !b) return undefined;
  const out: Record<string, GrammarProgress> = { ...(a || {}) };
  Object.entries(b || {}).forEach(([id, rp]) => {
    const lp = out[id];
    if (!lp) {
      out[id] = rp;
      return;
    }
    const newer = rp.lastAt > lp.lastAt ? rp : lp;
    out[id] = { best: Math.max(lp.best, rp.best), last: newer.last, attempts: Math.max(lp.attempts, rp.attempts), lastAt: newer.lastAt, wrong: newer.wrong };
  });
  return out;
}

/** Topics whose review date has come, most overdue first. */
export function dueTopics(topics: GrammarTopic[], progress: Record<string, GrammarProgress> | undefined, now = Date.now()): GrammarTopic[] {
  return topics
    .filter((t) => topicStatus(progress?.[t.id], now) === "due")
    .sort((x, y) => (progress![x.id].lastAt + reviewAfterDays(progress![x.id].last) * DAY_MS) - (progress![y.id].lastAt + reviewAfterDays(progress![y.id].last) * DAY_MS));
}

/** Today's grammar review: exercises still marked wrong first, then ones from the topics that are due. */
export function reviewSession(topics: GrammarTopic[], progress: Record<string, GrammarProgress> | undefined, size = SESSION_SIZE, now = Date.now(), rng: () => number = Math.random): SessionItem[] {
  const items: SessionItem[] = [];
  const seen = new Set<string>();
  const push = (x: SessionItem) => {
    if (!seen.has(x.id) && items.length < size) {
      seen.add(x.id);
      items.push(x);
    }
  };
  const byId = new Map<string, SessionItem>();
  topics.forEach((t) => t.exercises.forEach((exercise, i) => byId.set(exerciseId(t.id, i), { id: exerciseId(t.id, i), topic: t, exercise })));
  Object.values(progress || {}).forEach((p) => p.wrong.forEach((id) => byId.has(id) && push(byId.get(id)!)));
  // Take a few exercises from each due topic in turn, so no single topic fills the whole session
  const pools = dueTopics(topics, progress, now).map((t) => shuffle(t.exercises.map((_, i) => byId.get(exerciseId(t.id, i))!), rng));
  const PER_ROUND = 4;
  for (let offset = 0; items.length < size && pools.some((p) => offset < p.length); offset += PER_ROUND) {
    pools.forEach((p) => p.slice(offset, offset + PER_ROUND).forEach(push));
  }
  return shuffle(items, rng);
}
