import { UserStats } from "types";

export interface HourSlot {
  hour: number;
  total: number;
  correct: number;
  accuracy: number; // 0..1
}

export const MIN_REVIEWS_FOR_ADVICE = 30;
const MIN_PER_SLOT = 5;

/** Per-hour review counts and accuracy, for the 24 hours of the day. */
export function hourSlots(stats: UserStats): HourSlot[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const [total, correct] = stats.hourLog?.[String(hour)] || [0, 0];
    return { hour, total, correct, accuracy: total ? correct / total : 0 };
  });
}

/**
 * The hour in which the user remembers best, once there is enough data.
 * Ties on accuracy go to the hour with more practice.
 */
export function bestHour(stats: UserStats): HourSlot | null {
  const slots = hourSlots(stats);
  if (slots.reduce((a, s) => a + s.total, 0) < MIN_REVIEWS_FOR_ADVICE) return null;
  const eligible = slots.filter((s) => s.total >= MIN_PER_SLOT);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, s) => (s.accuracy > best.accuracy || (s.accuracy === best.accuracy && s.total > best.total) ? s : best));
}

export const hourToTime = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
