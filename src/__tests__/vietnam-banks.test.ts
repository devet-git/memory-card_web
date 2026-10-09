import { BANKS, findBank } from "data/vietnamBanks";

describe("vietnamBanks", () => {
  test("every bank has a unique 6-digit BIN and a unique code", () => {
    expect(BANKS.length).toBeGreaterThan(30);
    BANKS.forEach((b) => expect(b.bin).toMatch(/^\d{6}$/));
    expect(new Set(BANKS.map((b) => b.bin)).size).toBe(BANKS.length);
    expect(new Set(BANKS.map((b) => b.code.toLowerCase())).size).toBe(BANKS.length);
  });

  test("findBank accepts a BIN or a short code in any case", () => {
    expect(findBank("970436")?.code).toBe("VCB");
    expect(findBank("mb")?.bin).toBe("970422");
    expect(findBank(" Techcombank ")).toBeUndefined();
    expect(findBank("")).toBeUndefined();
    expect(findBank("nonsense")).toBeUndefined();
  });

  test("codes pass the server's bank id check", () => {
    BANKS.forEach((b) => expect(/^[A-Z0-9]{2,12}$/.test(b.code) && /^[A-Z0-9]{2,12}$/.test(b.bin)).toBe(true));
  });
});
