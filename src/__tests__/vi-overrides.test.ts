import overrides from "../../scripts/vi-overrides.json";

describe("hand-checked Vietnamese meanings", () => {
  const entries = Object.entries(overrides as Record<string, string>);

  test("is a sizeable list", () => {
    expect(entries.length).toBeGreaterThan(900);
  });

  test("keys are lowercase English words of 2+ letters", () => {
    entries.forEach(([k]) => expect(k).toMatch(/^[a-z]{2,}$/));
  });

  test("each value has 1-3 distinct, non-empty meanings", () => {
    entries.forEach(([k, v]) => {
      const parts = v.split(";").map((p) => p.trim());
      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts.length).toBeLessThanOrEqual(3);
      parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
      expect(new Set(parts).size).toBe(parts.length);
    });
  });

  test("spot checks of words that Wiktionary alone got wrong", () => {
    const o = overrides as Record<string, string>;
    expect(o.good.startsWith("tốt")).toBe(true);
    expect(o.pig).toBe("con lợn");
    expect(o.small.startsWith("nhỏ")).toBe(true);
  });
});
