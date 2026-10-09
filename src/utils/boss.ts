import { WordItem } from "types";
import { isLeech } from "utils/plan";
import { pickDistractors } from "utils/distractors";
import { firstMeaning, shuffle } from "utils/games";
import { normalizeAnswer } from "components/study/shared";

// Boss battle: a few minions (plain cards) and then a "boss", a card the learner keeps getting wrong.
// Hurting the boss takes three correct answers about the same word, asked in three different ways.

export const HEARTS = 5;
export const MINIONS = 3;
export const BOSS_HP = 3;
export const MIN_POOL = 4;

export type BattleQuestion =
  | { kind: "choice"; label: string; prompt: string; question: string; options: string[]; answer: string }
  | { kind: "type"; label: string; prompt: string; question: string; answer: string; hint: string };

export interface BossCandidate {
  word: WordItem;
  leech: boolean;
}

/** Cards worth fighting: leeches first, then anything answered wrong, hardest first. */
export function pickBosses(words: WordItem[], limit = 6): BossCandidate[] {
  return words
    .filter((w) => w.source.trim() && w.target.trim() && (isLeech(w) || (w.wrongCount || 0) > 0))
    .map((word) => ({ word, leech: isLeech(word) }))
    .sort((a, b) => Number(b.leech) - Number(a.leech) || (b.word.wrongCount || 0) - (a.word.wrongCount || 0) || (b.word.lapses || 0) - (a.word.lapses || 0))
    .slice(0, limit);
}

const meaningChoices = (word: WordItem, pool: WordItem[], rng: () => number) => {
  const answer = firstMeaning(word.target);
  const others = pool.filter((w) => w.id !== word.id).map((w) => ({ text: firstMeaning(w.target) }));
  return { answer, options: shuffle([answer, ...pickDistractors({ text: answer }, others, 3, rng)], rng) };
};

/** A multiple-choice question for an ordinary card: what does this term mean? */
export function minionQuestion(word: WordItem, pool: WordItem[], rng: () => number = Math.random): BattleQuestion {
  const { answer, options } = meaningChoices(word, pool, rng);
  return { kind: "choice", label: "Quái nhỏ", prompt: "Từ này nghĩa là gì?", question: word.source.trim(), options, answer };
}

/** Phase 0: term -> meaning, 1: meaning -> term, 2: type the term from its meaning. */
export function bossQuestion(phase: number, boss: WordItem, pool: WordItem[], rng: () => number = Math.random): BattleQuestion {
  const source = boss.source.trim();
  const meaning = firstMeaning(boss.target);
  if (phase <= 0) {
    const { answer, options } = meaningChoices(boss, pool, rng);
    return { kind: "choice", label: "Trùm • đòn 1/3", prompt: "Từ này nghĩa là gì?", question: source, options, answer };
  }
  if (phase === 1) {
    const others = pool.filter((w) => w.id !== boss.id).map((w) => ({ text: w.source.trim() }));
    return {
      kind: "choice",
      label: "Trùm • đòn 2/3",
      prompt: "Từ tiếng Anh nào có nghĩa này?",
      question: meaning,
      options: shuffle([source, ...pickDistractors({ text: source }, others, 3, rng)], rng),
      answer: source
    };
  }
  const hint = `${source.length} chữ cái, bắt đầu bằng “${source[0]}”`;
  return { kind: "type", label: "Trùm • đòn cuối", prompt: "Gõ từ tiếng Anh có nghĩa này", question: meaning, answer: source, hint };
}

export function isCorrect(q: BattleQuestion, input: string): boolean {
  if (q.kind === "choice") return input === q.answer;
  return normalizeAnswer(input) === normalizeAnswer(q.answer);
}

export interface BattleOutcome {
  won: boolean;
  heartsLeft: number;
  minionsDefeated: number;
  bossDamage: number;
}

export const battleScore = (o: BattleOutcome) => o.minionsDefeated * 30 + o.bossDamage * 60 + Math.max(0, o.heartsLeft) * 40 + (o.won ? 100 : 0);
export const battleCoins = (o: BattleOutcome) => (o.won ? 8 + Math.max(0, o.heartsLeft) * 2 : Math.floor(battleScore(o) / 40));

const BOSS_EMOJI = ["👹", "🐉", "👻", "🦂", "🕷️", "🧟", "🦖", "👾"];
export const bossEmoji = (word: WordItem) => {
  const key = String(word.id);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return BOSS_EMOJI[h % BOSS_EMOJI.length];
};
