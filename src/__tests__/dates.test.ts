import { dateKey, daysAgoKey, dayOfWeek } from "utils/dates";

describe("dates (local calendar)", () => {
  test("dateKey uses the local day, zero padded", () => {
    expect(dateKey(new Date(2026, 0, 5, 1, 30))).toBe("2026-01-05");
    expect(dateKey(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  test("daysAgoKey steps whole calendar days", () => {
    expect(daysAgoKey(0)).toBe(dateKey());
    const a = new Date();
    a.setDate(a.getDate() - 3);
    expect(daysAgoKey(3)).toBe(dateKey(a));
  });

  test("dayOfWeek reads the key as a local date", () => {
    expect(dayOfWeek("2026-01-04")).toBe(0); // Sunday
    expect(dayOfWeek("2026-01-05")).toBe(1); // Monday
  });
});
