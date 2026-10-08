import { pickDistractors, distance } from "utils/distractors";

const noJitter = () => 0;

describe("pickDistractors", () => {
  test("never returns the correct answer or duplicates, up to the requested count", () => {
    const out = pickDistractors(
      { text: "mèo" },
      [{ text: "Mèo" }, { text: "chó" }, { text: "chó" }, { text: "gà" }, { text: "vịt" }, { text: "bò" }],
      3,
      noJitter
    );
    expect(out).toHaveLength(3);
    expect(out.map((t) => t.toLowerCase())).not.toContain("mèo");
    expect(new Set(out).size).toBe(3);
  });

  test("prefers the same part of speech and a similar popularity", () => {
    const correct = { text: "chạy", profile: { pos: "v", rank: 300 } };
    const out = pickDistractors(
      correct,
      [
        { text: "xanh", profile: { pos: "a", rank: 5000 } },
        { text: "nhảy", profile: { pos: "v", rank: 400 } },
        { text: "bàn", profile: { pos: "n", rank: 20 } },
        { text: "đi", profile: { pos: "v", rank: 200 } }
      ],
      2,
      noJitter
    );
    expect(out.sort()).toEqual(["nhảy", "đi"].sort());
  });

  test("unknown data is neutral and the result is shorter than requested only when candidates run out", () => {
    expect(pickDistractors({ text: "a" }, [{ text: "b" }], 3, noJitter)).toEqual(["b"]);
    expect(distance({ text: "ab" }, { text: "cd" }, 0)).toBeGreaterThan(0);
  });
});
