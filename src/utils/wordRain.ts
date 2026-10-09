import { WordItem } from "types";
import { firstMeaning, shuffle } from "utils/games";
import { normalizeAnswer } from "components/study/shared";

// Word rain: meanings fall from the top; type the English word before one reaches the bottom.

export const RAIN_LIVES = 3;
export const RAIN_MIN_WORDS = 5;
export const MAX_DROPS = 6;
const LEVEL_EVERY = 8;

export interface Drop {
  uid: number;
  word: WordItem;
  x: number; // left edge, percent of the field
  y: number; // 0 = top, 1 = bottom (lost)
  speed: number; // field heights per second
}

export interface RainState {
  drops: Drop[];
  elapsed: number;
  nextSpawn: number; // seconds until the next drop
  uid: number;
  queue: WordItem[];
  cleared: number;
}

export const levelOf = (cleared: number) => 1 + Math.floor(cleared / LEVEL_EVERY);
/** Seconds a drop needs to fall the whole field. */
export const fallSeconds = (level: number) => Math.max(5, 15 - level * 1.3);
export const spawnGap = (level: number) => Math.max(1.2, 3.4 - level * 0.3);

/** Words that can be typed comfortably: no huge phrases. */
export const rainWords = (words: WordItem[]): WordItem[] => words.filter((w) => w.source.trim().length >= 2 && w.source.trim().length <= 14 && firstMeaning(w.target).length > 0);

export const newRain = (): RainState => ({ drops: [], elapsed: 0, nextSpawn: 0.4, uid: 1, queue: [], cleared: 0 });

export interface StepResult {
  state: RainState;
  lost: Drop[]; // drops that reached the bottom during this step
}

/** Advances the simulation by `dt` seconds. Pure: pass the same rng to get the same result. */
export function stepRain(prev: RainState, dt: number, pool: WordItem[], rng: () => number = Math.random): StepResult {
  const level = levelOf(prev.cleared);
  const lost: Drop[] = [];
  let drops = prev.drops.map((d) => ({ ...d, y: d.y + d.speed * dt }));
  const alive: Drop[] = [];
  for (const d of drops) (d.y >= 1 ? lost : alive).push(d);
  drops = alive;

  let { queue, uid, nextSpawn } = prev;
  nextSpawn -= dt;
  if (nextSpawn <= 0 && drops.length < MAX_DROPS && pool.length > 0) {
    queue = queue.length === 0 ? shuffle(pool, rng) : [...queue]; // never mutate the previous state's queue
    // skip words already falling
    const onScreen = new Set(drops.map((d) => String(d.word.id)));
    const at = queue.findIndex((w) => !onScreen.has(String(w.id)));
    if (at >= 0) {
      const [word] = queue.splice(at, 1);
      const len = word.source.trim().length;
      const width = Math.min(46, 14 + firstMeaning(word.target).length * 1.6);
      drops = [...drops, { uid: uid++, word, x: Math.round(rng() * (100 - width)), y: 0, speed: (1 / fallSeconds(level)) * (0.9 + rng() * 0.25) * (len > 9 ? 0.85 : 1) }];
    }
    nextSpawn = spawnGap(level) * (0.8 + rng() * 0.4);
  }
  return { state: { ...prev, drops, elapsed: prev.elapsed + dt, nextSpawn, uid, queue }, lost };
}

/**
 * The drop a typed text should destroy: an exact match, as long as it can't still be the start of a
 * longer falling word (so "cat" doesn't fire while "category" is on screen). `force` ignores that (Enter).
 */
export function matchDrop(drops: Drop[], typed: string, force = false): Drop | null {
  const t = normalizeAnswer(typed);
  if (!t) return null;
  const hits = drops.filter((d) => normalizeAnswer(d.word.source) === t).sort((a, b) => b.y - a.y);
  if (hits.length === 0) return null;
  if (!force && drops.some((d) => normalizeAnswer(d.word.source).length > t.length && normalizeAnswer(d.word.source).startsWith(t))) return null;
  return hits[0];
}

export const rainPoints = (word: WordItem, combo: number) => (10 + word.source.trim().length * 2) * Math.min(4, 1 + Math.floor(combo / 5));
export const rainCoins = (score: number) => Math.floor(score / 25);
