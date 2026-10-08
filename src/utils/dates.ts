// Day keys ("YYYY-MM-DD") use the user's LOCAL calendar day, so studying at 1am counts for that
// day and not for "yesterday in UTC". Keys from older versions were UTC-based; the difference only
// affects entries made between local midnight and the UTC offset.

const pad = (n: number) => String(n).padStart(2, "0");

export const dateKey = (d: Date | number = new Date()): string => {
  const date = new Date(d);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Key for `n` calendar days before today (DST-safe: steps by calendar day, not by 24h). */
export const daysAgoKey = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" key, in the local calendar. */
export const dayOfWeek = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};
