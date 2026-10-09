import { UserStats } from "types";
import { dateKey } from "utils/dates";

export const MONTHLY_FREEZES = 2;
export const MAX_FREEZES = 3;
/** A freeze can bridge at most this many missed days in a row. */
export const MAX_FROZEN_GAP = 2;

const DAY_MS = 86400000;
const monthOf = (key: string) => key.slice(0, 7);

/** Whole calendar days from key `a` to key `b` ("YYYY-MM-DD"), DST-safe. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

/** Day key `n` days after `key`. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** Tops up the freeze allowance once per calendar month. */
export function grantMonthlyFreezes(stats: UserStats, today = dateKey()): UserStats {
  const month = monthOf(today);
  if (stats.freezeMonth === month) return stats;
  const have = stats.freezes ?? 0;
  return { ...stats, freezes: Math.min(MAX_FREEZES, have + MONTHLY_FREEZES), freezeMonth: month };
}

/**
 * Registers one reviewed card on `today`: bumps the review log, the streak and the hour pattern.
 * When days were missed and freezes are available, they cover the gap instead of resetting the streak.
 */
export function recordStudy(prev: UserStats, correct = true, now: Date = new Date()): UserStats {
  const today = dateKey(now);
  const base = grantMonthlyFreezes(prev, today);
  const hour = String(now.getHours());
  const [hTotal, hOk] = base.hourLog?.[hour] || [0, 0];
  const next: UserStats = {
    ...base,
    reviewLog: { ...(base.reviewLog || {}), [today]: ((base.reviewLog || {})[today] || 0) + 1 },
    hourLog: { ...(base.hourLog || {}), [hour]: [hTotal + 1, hOk + (correct ? 1 : 0)] },
    totalCardsReviewed: base.totalCardsReviewed + 1
  };
  if (base.lastStudyDate === today) return next;

  const missed = daysBetween(base.lastStudyDate, today) - 1;
  const freezes = base.freezes ?? 0;
  if (missed <= 0) {
    return { ...next, studyStreakDays: base.studyStreakDays + 1, lastStudyDate: today };
  }
  if (missed <= MAX_FROZEN_GAP && freezes >= missed) {
    const covered = Array.from({ length: missed }, (_, i) => addDays(base.lastStudyDate, i + 1));
    return {
      ...next,
      studyStreakDays: base.studyStreakDays + 1,
      lastStudyDate: today,
      freezes: freezes - missed,
      frozenDays: Array.from(new Set([...(base.frozenDays || []), ...covered])).sort().slice(-60)
    };
  }
  return { ...next, studyStreakDays: 1, lastStudyDate: today };
}

/** Takes back the counters of the last recorded answer (the streak itself is left alone). */
export function undoStudy(prev: UserStats, now: Date = new Date()): UserStats {
  const today = dateKey(now);
  const log = { ...(prev.reviewLog || {}) };
  if (log[today]) log[today] = Math.max(0, log[today] - 1);
  return { ...prev, reviewLog: log, totalCardsReviewed: Math.max(0, prev.totalCardsReviewed - 1) };
}

/** Days of the current week (Monday first) up to `today` on which the user studied. */
export function weekProgress(stats: UserStats, today = dateKey()): { studied: number; days: { key: string; done: boolean; frozen: boolean }[] } {
  const [y, m, d] = today.split("-").map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday = 0
  const frozen = new Set(stats.frozenDays || []);
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - dow);
    return { key, done: (stats.reviewLog?.[key] || 0) > 0, frozen: frozen.has(key) };
  });
  return { studied: days.filter((x) => x.done || x.frozen).length, days };
}
