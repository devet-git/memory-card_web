import { GameProfile, UserStats } from "types";
import { profileOf } from "utils/games";
import { MAX_FREEZES } from "utils/streak";

export type Slot = "accent" | "plant" | "palette";

export interface ShopItem {
  id: string;
  kind: "cosmetic" | "consumable";
  slot?: Slot;
  name: string;
  desc: string;
  price: number;
  preview: string; // emoji, or a colour for accents
  data?: Record<string, string>;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "freeze", kind: "consumable", name: "Băng streak", desc: `Thêm 1 băng giữ chuỗi ngày (giữ tối đa ${MAX_FREEZES}).`, price: 60, preview: "🧊" },
  { id: "accent-sunset", kind: "cosmetic", slot: "accent", name: "Màu Hoàng hôn", desc: "Đổi màu chủ đạo của app sang cam.", price: 80, preview: "#f97316", data: { primary: "#f97316", hover: "#ea580c", from: "#fb923c", to: "#ea580c" } },
  { id: "accent-forest", kind: "cosmetic", slot: "accent", name: "Màu Rừng xanh", desc: "Đổi màu chủ đạo của app sang xanh lá.", price: 80, preview: "#10b981", data: { primary: "#10b981", hover: "#059669", from: "#34d399", to: "#059669" } },
  { id: "accent-sakura", kind: "cosmetic", slot: "accent", name: "Màu Anh đào", desc: "Đổi màu chủ đạo của app sang hồng.", price: 80, preview: "#ec4899", data: { primary: "#ec4899", hover: "#db2777", from: "#f472b6", to: "#db2777" } },
  { id: "accent-violet", kind: "cosmetic", slot: "accent", name: "Màu Tím mộng mơ", desc: "Đổi màu chủ đạo của app sang tím.", price: 80, preview: "#8b5cf6", data: { primary: "#8b5cf6", hover: "#7c3aed", from: "#a78bfa", to: "#7c3aed" } },
  { id: "plant-cactus", kind: "cosmetic", slot: "plant", name: "Vườn xương rồng", desc: "Cây trong Vườn từ vựng thành xương rồng.", price: 60, preview: "🌵", data: { seed: "🌱", sprout: "🌵", tree: "🌵", bloom: "🌼", wilted: "🥀" } },
  { id: "plant-mushroom", kind: "cosmetic", slot: "plant", name: "Vườn nấm", desc: "Cây trong Vườn từ vựng thành nấm.", price: 60, preview: "🍄", data: { seed: "🥚", sprout: "🍄", tree: "🍄", bloom: "🌟", wilted: "🥀" } },
  { id: "palette-contrast", kind: "cosmetic", slot: "palette", name: "Màu dễ phân biệt", desc: "Bảng màu xanh dương/cam cho Đoán chữ, dễ nhìn hơn với người khó phân biệt xanh lá và vàng.", price: 40, preview: "🟦", data: { correct: "#2563eb", present: "#f97316", absent: "#475569" } }
];

export const itemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id);

export const balanceOf = (profile: GameProfile) => Math.max(0, profile.coins - (profile.spent || 0));
export const owns = (profile: GameProfile, id: string) => (profile.owned || []).includes(id);

export interface ShopResult {
  stats: UserStats;
  error?: string;
}

/** Buys an item: pays with coins, grants a consumable at once, or unlocks (and equips) a cosmetic. */
export function purchase(stats: UserStats, id: string): ShopResult {
  const item = itemById(id);
  if (!item) return { stats, error: "Không tìm thấy vật phẩm." };
  const g = profileOf(stats);
  if (item.kind === "cosmetic" && owns(g, id)) return { stats, error: "Bạn đã sở hữu vật phẩm này." };
  if (balanceOf(g) < item.price) return { stats, error: `Chưa đủ xu (cần ${item.price} 🪙).` };

  if (item.kind === "consumable") {
    const have = stats.freezes ?? 0;
    if (have >= MAX_FREEZES) return { stats, error: `Bạn đã có đủ ${MAX_FREEZES} băng streak.` };
    return { stats: { ...stats, freezes: have + 1, games: { ...g, spent: (g.spent || 0) + item.price } } };
  }
  return {
    stats: {
      ...stats,
      games: { ...g, spent: (g.spent || 0) + item.price, owned: [...(g.owned || []), id], equipped: { ...(g.equipped || {}), [item.slot as Slot]: id } }
    }
  };
}

export function equip(stats: UserStats, id: string): ShopResult {
  const item = itemById(id);
  const g = profileOf(stats);
  if (!item || item.kind !== "cosmetic" || !item.slot) return { stats, error: "Không dùng được vật phẩm này." };
  if (!owns(g, id)) return { stats, error: "Bạn chưa sở hữu vật phẩm này." };
  return { stats: { ...stats, games: { ...g, equipped: { ...(g.equipped || {}), [item.slot]: id } } } };
}

export function unequip(stats: UserStats, slot: Slot): UserStats {
  const g = profileOf(stats);
  const equipped = { ...(g.equipped || {}) };
  delete equipped[slot];
  return { ...stats, games: { ...g, equipped } };
}

/** The data of the item equipped in a slot, or null for the default look. */
export function equippedData(profile: GameProfile, slot: Slot): Record<string, string> | null {
  const id = profile.equipped?.[slot];
  const item = id ? itemById(id) : undefined;
  return item && owns(profile, item.id) ? item.data || null : null;
}

/** Applies (or clears) the accent colour of the whole app through CSS variables. */
export function applyAccent(data: Record<string, string> | null, root: HTMLElement = document.documentElement) {
  const vars: Record<string, string | undefined> = {
    "--accent-primary": data?.primary,
    "--accent-hover": data?.hover,
    "--btn-from": data?.from,
    "--btn-to": data?.to
  };
  Object.entries(vars).forEach(([k, v]) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k)));
}
