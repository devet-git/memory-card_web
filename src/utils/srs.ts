import { WordItem } from "types";
import { review as fsrsReview, difficultyFromEase, FsrsRating, FsrsState, DEFAULT_RETENTION, clampRetention } from "utils/fsrs";

// Spaced repetition (simplified SM-2).
// Grades: 0 = Again (forgot), 1 = Hard, 2 = Good, 3 = Easy
export type Grade = 0 | 1 | 2 | 3;

export const DAY_MS = 86400000;
export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
export const NEW_CARDS_PER_SESSION = 10;
export const MASTERED_INTERVAL_DAYS = 21;

export type Algorithm = "sm2" | "fsrs";

export interface SrsOptions {
  algorithm?: Algorithm;
  retention?: number; // FSRS only: target probability of recall at review time
}

/** Schedules the next review of a card with the chosen algorithm (SM-2 unless told otherwise). */
export function schedule(word: WordItem, grade: Grade, now = Date.now(), opts: SrsOptions = {}): Partial<WordItem> {
  return opts.algorithm === "fsrs" ? scheduleFsrs(word, grade, now, opts.retention) : scheduleSm2(word, grade, now);
}

/** The memory state FSRS should continue from: its own, or one derived from the SM-2 history. */
function fsrsStateOf(word: WordItem): FsrsState | null {
  if (word.stability && word.difficulty) return { stability: word.stability, difficulty: word.difficulty };
  const interval = word.intervalDays || 0;
  if (interval > 0) return { stability: interval, difficulty: difficultyFromEase(word.ease || DEFAULT_EASE) };
  return null;
}

function scheduleFsrs(word: WordItem, grade: Grade, now: number, retention = DEFAULT_RETENTION): Partial<WordItem> {
  const state = fsrsStateOf(word);
  const elapsed = state && word.lastReviewed ? Math.max(0, (now - word.lastReviewed) / DAY_MS) : state ? word.intervalDays || 0 : 0;
  const outcome = fsrsReview(state, elapsed, clampRetention(retention))[(grade + 1) as FsrsRating];
  const failed = grade === 0;
  return {
    stability: Math.round(outcome.stability * 1000) / 1000,
    difficulty: Math.round(outcome.difficulty * 1000) / 1000,
    intervalDays: outcome.interval,
    dueDate: failed ? now + 10 * 60 * 1000 : now + outcome.interval * DAY_MS,
    lapses: (word.lapses || 0) + (failed ? 1 : 0),
    wrongCount: (word.wrongCount || 0) + (failed ? 1 : 0),
    status: outcome.interval >= MASTERED_INTERVAL_DAYS ? "mastered" : "learning"
  };
}

function scheduleSm2(word: WordItem, grade: Grade, now: number): Partial<WordItem> {
  const prevInterval = word.intervalDays || 0;
  let ease = word.ease || DEFAULT_EASE;
  let lapses = word.lapses || 0;
  let wrongCount = word.wrongCount || 0;
  let interval: number;
  let dueDate: number;

  switch (grade) {
    case 0:
      ease = Math.max(MIN_EASE, ease - 0.2);
      lapses += 1;
      wrongCount += 1;
      interval = 0;
      dueDate = now + 10 * 60 * 1000; // see it again within the session
      break;
    case 1:
      ease = Math.max(MIN_EASE, ease - 0.15);
      interval = prevInterval <= 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
      dueDate = now + interval * DAY_MS;
      break;
    case 3:
      ease = ease + 0.15;
      interval = prevInterval <= 0 ? 4 : Math.max(prevInterval + 1, Math.round(prevInterval * ease * 1.3));
      dueDate = now + interval * DAY_MS;
      break;
    default:
      if (prevInterval <= 0) interval = 1;
      else if (prevInterval === 1) interval = 3;
      else interval = Math.round(prevInterval * ease);
      dueDate = now + interval * DAY_MS;
  }

  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays: interval,
    dueDate,
    lapses,
    wrongCount,
    // SM-2 owns the schedule now; drop FSRS state so a later switch back to FSRS starts from this interval
    stability: undefined,
    difficulty: undefined,
    status: interval >= MASTERED_INTERVAL_DAYS ? "mastered" : "learning"
  };
}

export const isNewCard = (w: WordItem) => w.dueDate === undefined && (w.reviewCount || 0) === 0;

export const isDue = (w: WordItem, now = Date.now()) => w.dueDate !== undefined && w.dueDate <= now;

/** Human readable preview of the next interval for a grade (for rating buttons). */
export function previewInterval(word: WordItem, grade: Grade, opts: SrsOptions = {}): string {
  const next = schedule(word, grade, Date.now(), opts);
  const days = next.intervalDays || 0;
  if (days <= 0) return "<10 phút";
  if (days === 1) return "1 ngày";
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}
