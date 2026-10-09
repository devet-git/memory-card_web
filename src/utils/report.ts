import { CollectionItem, UserStats } from "types";
import { dateKey } from "utils/dates";
import { addDays } from "utils/streak";
import { hourSlots } from "utils/studyHours";
import { firstMeaning } from "utils/games";

export type Period = "week" | "month";
export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 };
export const PERIOD_LABEL: Record<Period, string> = { week: "7 ngày qua", month: "30 ngày qua" };

export interface HardWord {
  source: string;
  meaning: string;
  wrong: number;
}

export interface Report {
  period: Period;
  from: string; // first day of the period
  to: string; // last day (today)
  reviews: number;
  previousReviews: number; // the same number of days right before the period
  daysStudied: number;
  goalDays: number; // days that reached the daily goal
  bestDay: { day: string; count: number } | null;
  averagePerStudyDay: number;
  cardsTouched: number; // distinct cards reviewed in the period
  masteredTouched: number; // of those, cards that are now mastered
  busiestHour: number | null; // all-time pattern, as a period-independent hint
  hardWords: HardWord[];
  streak: number;
}

/** Numbers behind the weekly / monthly summary, from the review log and the cards. */
export function buildReport(stats: UserStats, collections: CollectionItem[], period: Period, goal: number, now: Date = new Date()): Report {
  const days = PERIOD_DAYS[period];
  const to = dateKey(now);
  const from = addDays(to, -(days - 1));
  const log = stats.reviewLog || {};

  const inRange = (key: string, a: string, b: string) => key >= a && key <= b;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));

  let reviews = 0;
  let previousReviews = 0;
  let daysStudied = 0;
  let goalDays = 0;
  let bestDay: Report["bestDay"] = null;
  for (const [key, count] of Object.entries(log)) {
    if (inRange(key, prevFrom, prevTo)) previousReviews += count;
    if (!inRange(key, from, to) || count <= 0) continue;
    reviews += count;
    daysStudied++;
    if (count >= goal) goalDays++;
    if (!bestDay || count > bestDay.count) bestDay = { day: key, count };
  }

  const startMs = new Date(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10))).getTime();
  const touched = collections.flatMap((c) => c.words).filter((w) => (w.lastReviewed || 0) >= startMs);
  const hardWords = [...touched]
    .filter((w) => (w.wrongCount || 0) > 0)
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
    .slice(0, 3)
    .map((w) => ({ source: w.source, meaning: firstMeaning(w.target), wrong: w.wrongCount || 0 }));

  const slots = hourSlots(stats);
  const top = slots.reduce((best, s) => (s.total > best.total ? s : best), slots[0]);

  return {
    period,
    from,
    to,
    reviews,
    previousReviews,
    daysStudied,
    goalDays,
    bestDay,
    averagePerStudyDay: daysStudied ? Math.round(reviews / daysStudied) : 0,
    cardsTouched: touched.length,
    masteredTouched: touched.filter((w) => w.status === "mastered").length,
    busiestHour: top.total > 0 ? top.hour : null,
    hardWords,
    streak: stats.studyStreakDays
  };
}

/** Change versus the previous period as a rounded percentage, or null when there is nothing to compare with. */
export const changePct = (r: Report): number | null => (r.previousReviews > 0 ? Math.round(((r.reviews - r.previousReviews) / r.previousReviews) * 100) : null);

const dm = (key: string) => `${Number(key.slice(8, 10))}/${Number(key.slice(5, 7))}`;

/** A short message that can be pasted anywhere. */
export function reportText(r: Report): string {
  const change = changePct(r);
  const lines = [
    `📊 MemCard • Tổng kết ${r.period === "week" ? "tuần" : "tháng"} (${dm(r.from)} – ${dm(r.to)})`,
    `• ${r.reviews} lượt ôn trong ${r.daysStudied}/${PERIOD_DAYS[r.period]} ngày${change === null ? "" : ` (${change >= 0 ? "+" : ""}${change}% so với kỳ trước)`}`,
    `• ${r.cardsTouched} thẻ đã ôn, ${r.masteredTouched} thẻ đã thuộc`,
    `• Chuỗi hiện tại: ${r.streak} ngày 🔥`
  ];
  if (r.bestDay) lines.push(`• Ngày chăm nhất: ${dm(r.bestDay.day)} với ${r.bestDay.count} lượt`);
  if (r.hardWords.length) lines.push(`• Từ khó nhất: ${r.hardWords.map((w) => w.source).join(", ")}`);
  return lines.join("\n");
}
