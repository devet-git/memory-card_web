import { UserStats } from "types";
import { profileOf } from "utils/games";

// Experience points are derived from what is already stored, so nothing extra has to be tracked or synced:
// every review, every day studied and every game coin earned counts.

export const XP_PER_REVIEW = 2;
export const XP_PER_STUDY_DAY = 10;

export function xpOf(stats: UserStats): number {
  const studyDays = Object.values(stats.reviewLog || {}).filter((n) => n > 0).length;
  return Math.max(0, stats.totalCardsReviewed) * XP_PER_REVIEW + studyDays * XP_PER_STUDY_DAY + profileOf(stats).coins;
}

/** Total XP needed to reach `level` (level 1 = 0): 100, 300, 600, 1000, ... */
export const xpForLevel = (level: number): number => 50 * (level - 1) * level;

const TITLES = ["Người mới", "Học việc", "Chăm chỉ", "Thông thạo", "Cao thủ", "Bậc thầy", "Huyền thoại"];
export const titleOf = (level: number) => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))];

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  into: number; // XP earned inside the current level
  needed: number; // XP the current level asks for
  pct: number; // 0..100 progress to the next level
}

export function levelInfo(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpForLevel(level + 1) <= safe) level++;
  const floor = xpForLevel(level);
  const needed = xpForLevel(level + 1) - floor;
  const into = safe - floor;
  return { level, title: titleOf(level), xp: safe, into, needed, pct: Math.min(100, Math.round((into / needed) * 100)) };
}
