import { WordItem } from "types";
import { shuffle } from "utils/games";
import { BattleQuestion, bossQuestion, minionQuestion } from "utils/boss";

// Tower climb: every floor is one question, harder cards and trickier question types higher up.
// A wrong answer costs a life and the floor is retried with another card; lose all lives and the climb ends.

export const TOWER_LIVES = 3;
export const TOWER_MIN_WORDS = 6;
/** How many floors it takes to climb from the easiest card to the hardest. */
const RAMP_FLOORS = 30;

export type FloorKind = "meaning" | "term" | "typing";

/** Higher = harder for this learner: misses, lapses and the FSRS difficulty all count. */
export const hardness = (w: WordItem): number => (w.wrongCount || 0) * 2 + (w.lapses || 0) * 2 + (w.difficulty ?? 5) / 2 + Math.min(4, (w.source.length - 4) / 3);

/** Every 5th floor asks to type the word, every 3rd (otherwise) asks for the term, the rest ask for the meaning. */
export const floorKind = (floor: number): FloorKind => (floor % 5 === 0 ? "typing" : floor % 3 === 0 ? "term" : "meaning");

/** Easiest cards first; ties are shuffled so runs differ. */
export function sortByHardness(words: WordItem[], rng: () => number = Math.random): WordItem[] {
  return shuffle(words, rng).sort((a, b) => hardness(a) - hardness(b));
}

/**
 * The card for a floor: a position along the hardness ramp with a little randomness,
 * skipping cards already used in this climb (the used set resets when the deck runs out).
 */
export function pickFloorWord(sorted: WordItem[], floor: number, used: Set<string>, rng: () => number = Math.random): WordItem {
  const n = sorted.length;
  if (used.size >= n) used.clear();
  const target = Math.min(n - 1, Math.floor(((floor - 1) / RAMP_FLOORS) * n + rng() * Math.max(2, n / 6)));
  // nearest unused card to the target position
  for (let d = 0; d < n; d++) {
    for (const i of [target + d, target - d]) {
      if (i >= 0 && i < n && !used.has(String(sorted[i].id))) {
        used.add(String(sorted[i].id));
        return sorted[i];
      }
    }
  }
  return sorted[target];
}

export function floorQuestion(floor: number, word: WordItem, pool: WordItem[], rng: () => number = Math.random): BattleQuestion {
  const kind = floorKind(floor);
  const q = kind === "typing" ? bossQuestion(2, word, pool, rng) : kind === "term" ? bossQuestion(1, word, pool, rng) : minionQuestion(word, pool, rng);
  return { ...q, label: `Tầng ${floor}` };
}

export const floorPoints = (floor: number) => 10 + floor * 2;
export const towerCoins = (score: number) => Math.floor(score / 20);
