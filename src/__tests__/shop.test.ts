import { SHOP_ITEMS, itemById, purchase, equip, unequip, balanceOf, owns, equippedData, applyAccent } from "utils/shop";
import { mergeGameProfiles, profileOf, applyGameResult, emptyProfile } from "utils/games";
import { MAX_FREEZES } from "utils/streak";
import { UserStats } from "types";

const stats = (coins: number, over: Partial<UserStats> = {}): UserStats => ({
  studyStreakDays: 1,
  lastStudyDate: "2026-03-10",
  totalCardsReviewed: 0,
  quizzesCompleted: 0,
  games: { ...emptyProfile(), coins },
  ...over
});

describe("shop", () => {
  test("every item has a unique id and a positive price", () => {
    const ids = SHOP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    SHOP_ITEMS.forEach((i) => expect(i.price).toBeGreaterThan(0));
    SHOP_ITEMS.filter((i) => i.kind === "cosmetic").forEach((i) => expect(i.slot).toBeTruthy());
  });

  test("buying a cosmetic pays, unlocks and equips it", () => {
    const r = purchase(stats(100), "accent-sunset");
    expect(r.error).toBeUndefined();
    const g = profileOf(r.stats);
    expect(balanceOf(g)).toBe(100 - itemById("accent-sunset")!.price);
    expect(owns(g, "accent-sunset")).toBe(true);
    expect(equippedData(g, "accent")).toMatchObject({ primary: "#f97316" });
  });

  test("not enough coins, unknown items and double purchases are refused without changing anything", () => {
    const poor = stats(10);
    expect(purchase(poor, "accent-sunset")).toEqual({ stats: poor, error: expect.stringContaining("Chưa đủ xu") });
    expect(purchase(poor, "nope").error).toBeTruthy();
    const bought = purchase(stats(500), "plant-cactus").stats;
    expect(purchase(bought, "plant-cactus").error).toContain("đã sở hữu");
  });

  test("a freeze is a consumable that is capped", () => {
    let s = stats(1000, { freezes: MAX_FREEZES - 1 });
    const r = purchase(s, "freeze");
    expect(r.stats.freezes).toBe(MAX_FREEZES);
    expect(balanceOf(profileOf(r.stats))).toBe(1000 - itemById("freeze")!.price);
    expect(purchase(r.stats, "freeze").error).toContain("đủ");
    s = r.stats;
    expect(owns(profileOf(s), "freeze")).toBe(false);
  });

  test("equip needs ownership, switching replaces the slot, unequip clears it", () => {
    let s = stats(1000);
    expect(equip(s, "accent-forest").error).toContain("chưa sở hữu");
    s = purchase(s, "accent-forest").stats;
    s = purchase(s, "accent-violet").stats; // equips the newer one
    expect(profileOf(s).equipped?.accent).toBe("accent-violet");
    s = equip(s, "accent-forest").stats;
    expect(equippedData(profileOf(s), "accent")).toMatchObject({ primary: "#10b981" });
    s = unequip(s, "accent");
    expect(equippedData(profileOf(s), "accent")).toBeNull();
    expect(equip(s, "freeze").error).toBeTruthy();
  });

  test("playing keeps the shop state, and spending doesn't touch earned coins", () => {
    let s = purchase(stats(100), "palette-contrast").stats;
    s = applyGameResult(s, { game: "tf", score: 50, coins: 10 });
    const g = profileOf(s);
    expect(g.coins).toBe(110);
    expect(g.spent).toBe(40);
    expect(owns(g, "palette-contrast")).toBe(true);
    expect(balanceOf(g)).toBe(70);
  });

  test("two devices merge without refunding or losing purchases", () => {
    const a = { ...emptyProfile(), coins: 100, spent: 80, owned: ["accent-sunset"], equipped: { accent: "accent-sunset" } };
    const b = { ...emptyProfile(), coins: 130, spent: 0, owned: ["plant-cactus"], equipped: { accent: "accent-forest", plant: "plant-cactus" } };
    const m = mergeGameProfiles(a, b)!;
    expect(m.coins).toBe(130);
    expect(m.spent).toBe(80);
    expect(balanceOf(m)).toBe(50);
    expect(m.owned!.sort()).toEqual(["accent-sunset", "plant-cactus"]);
    expect(m.equipped).toEqual({ accent: "accent-sunset", plant: "plant-cactus" });
  });

  test("applyAccent sets and clears the CSS variables", () => {
    const root = document.createElement("div");
    applyAccent({ primary: "#111111", hover: "#222222", from: "#333333", to: "#444444" }, root);
    expect(root.style.getPropertyValue("--accent-primary")).toBe("#111111");
    expect(root.style.getPropertyValue("--btn-from")).toBe("#333333");
    applyAccent(null, root);
    expect(root.style.getPropertyValue("--accent-primary")).toBe("");
    expect(root.style.getPropertyValue("--btn-to")).toBe("");
  });
});
