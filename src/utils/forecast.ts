import { CollectionItem } from "types";
import { dateKey } from "utils/dates";

export interface ForecastDay {
  key: string; // local 'YYYY-MM-DD'
  date: Date;
  count: number; // cards falling due that day (today also includes everything overdue)
}

export interface Forecast {
  days: ForecastDay[];
  overdue: number; // already past due before today (included in days[0])
  total: number; // cards due within the window
  peak: ForecastDay | null;
}

/** How many cards fall due on each of the next `span` calendar days (local time). */
export function buildForecast(collections: CollectionItem[], span = 14, now: Date = new Date()): Forecast {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days: ForecastDay[] = Array.from({ length: span }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { key: dateKey(date), date, count: 0 };
  });
  const index = new Map(days.map((d, i) => [d.key, i]));
  const todayKey = days[0].key;
  let overdue = 0;

  for (const c of collections) {
    for (const w of c.words) {
      if (w.dueDate === undefined) continue;
      const key = dateKey(w.dueDate);
      if (key < todayKey) {
        days[0].count++;
        overdue++;
      } else {
        const i = index.get(key);
        if (i !== undefined) days[i].count++;
      }
    }
  }

  const total = days.reduce((a, d) => a + d.count, 0);
  const peak = days.reduce<ForecastDay | null>((best, d) => (d.count > 0 && (!best || d.count > best.count) ? d : best), null);
  return { days, overdue, total, peak };
}
