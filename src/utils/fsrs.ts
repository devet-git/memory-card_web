// FSRS (Free Spaced Repetition Scheduler), v4.5 formulas with the published default parameters.
// Every card has a stability S (days until recall drops to 90%) and a difficulty D (1..10).
// The next interval is chosen so that predicted recall equals the user's desired retention.
// Pure functions only: this module knows nothing about cards or storage.

export type FsrsRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const DEFAULT_W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];

export const DEFAULT_RETENTION = 0.9;
export const MIN_RETENTION = 0.7;
export const MAX_RETENTION = 0.97;
export const MAX_INTERVAL_DAYS = 36500;
const MIN_STABILITY = 0.01;

const DECAY = -0.5;
const FACTOR = 19 / 81; // makes R(S, S) = 90%

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clampDifficulty = (d: number) => clamp(d, 1, 10);

export const clampRetention = (r: number | undefined): number =>
  clamp(Number.isFinite(r) ? (r as number) : DEFAULT_RETENTION, MIN_RETENTION, MAX_RETENTION);

/** Probability of recalling a card after `elapsedDays`, given its stability. */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / Math.max(stability, MIN_STABILITY), DECAY);
}

/** Days until predicted recall falls to `retention` (unrounded). */
export function intervalFor(stability: number, retention: number): number {
  return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
}

export const initialStability = (rating: FsrsRating, w = DEFAULT_W) => Math.max(MIN_STABILITY, w[rating - 1]);
export const initialDifficulty = (rating: FsrsRating, w = DEFAULT_W) => clampDifficulty(w[4] - (rating - 3) * w[5]);

export function nextDifficulty(d: number, rating: FsrsRating, w = DEFAULT_W): number {
  const shifted = d - w[6] * (rating - 3);
  // pull back towards the difficulty of an average first answer so it can't get stuck at 10
  return clampDifficulty(w[7] * w[4] + (1 - w[7]) * shifted);
}

export function stabilityAfterRecall(d: number, s: number, r: number, rating: FsrsRating, w = DEFAULT_W): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const growth = Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * hardPenalty * easyBonus;
  return Math.max(MIN_STABILITY, s * (1 + growth));
}

export function stabilityAfterForget(d: number, s: number, r: number, w = DEFAULT_W): number {
  const next = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  return Math.max(MIN_STABILITY, Math.min(next, s)); // forgetting never makes a memory stronger
}

export interface FsrsState {
  stability: number;
  difficulty: number;
}

export interface FsrsOutcome extends FsrsState {
  /** Whole days until the next review; 0 means "again" (relearn within the session). */
  interval: number;
}

const toDays = (stability: number, retention: number) => clamp(Math.round(intervalFor(stability, retention)), 1, MAX_INTERVAL_DAYS);

/**
 * The result of each rating for a card. `state` is null for a card never reviewed.
 * Intervals are kept in order: Hard < Good < Easy, as one day apart at minimum.
 */
export function review(state: FsrsState | null, elapsedDays: number, retentionTarget: number, w = DEFAULT_W): Record<FsrsRating, FsrsOutcome> {
  const retention = clampRetention(retentionTarget);
  const outcome = (rating: FsrsRating): FsrsState => {
    if (!state) return { stability: initialStability(rating, w), difficulty: initialDifficulty(rating, w) };
    const r = retrievability(elapsedDays, state.stability);
    return {
      difficulty: nextDifficulty(state.difficulty, rating, w),
      stability: rating === 1 ? stabilityAfterForget(state.difficulty, state.stability, r, w) : stabilityAfterRecall(state.difficulty, state.stability, r, rating, w)
    };
  };

  const again = outcome(1);
  const hard = outcome(2);
  const good = outcome(3);
  const easy = outcome(4);

  const goodDays0 = toDays(good.stability, retention);
  const hardDays = Math.min(toDays(hard.stability, retention), goodDays0);
  const goodDays = Math.max(goodDays0, hardDays + 1);
  const easyDays = Math.max(toDays(easy.stability, retention), goodDays + 1);

  return {
    1: { ...again, interval: 0 },
    2: { ...hard, interval: hardDays },
    3: { ...good, interval: goodDays },
    4: { ...easy, interval: Math.min(easyDays, MAX_INTERVAL_DAYS) }
  };
}

/** Rough FSRS difficulty for a card that was scheduled by SM-2 (low ease = hard). */
export function difficultyFromEase(ease: number): number {
  // ease 2.5 (default) -> 5, 1.3 (minimum) -> ~9, 3.5 -> ~2
  return clampDifficulty(5 + ((2.5 - ease) / 1.2) * 4);
}
