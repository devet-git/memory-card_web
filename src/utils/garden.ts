import { WordItem } from "types";
import { retrievability } from "utils/fsrs";
import { DAY_MS, MASTERED_INTERVAL_DAYS } from "utils/srs";

// Vocabulary garden: every card is a plant. Its stage shows how well established the card is,
// and how fresh it looks shows how likely you are to remember it right now.

export type PlantStage = "seed" | "sprout" | "tree" | "bloom";
export type Thirst = "fresh" | "thirsty" | "wilted";

export interface Plant {
  word: WordItem;
  stage: PlantStage;
  health: number | null; // predicted chance of recall (0..1); null for a seed that was never reviewed
  thirst: Thirst;
}

export type Skin = Record<PlantStage | "wilted", string>;
export const DEFAULT_SKIN: Skin = { seed: "🌰", sprout: "🌱", tree: "🌳", bloom: "🌸", wilted: "🥀" };

export const FRESH_AT = 0.85;
export const WILTED_BELOW = 0.7; // the forgetting curve is a power law, so this is already ~5x past the planned interval
const TREE_INTERVAL_DAYS = 7;
const JUST_FAILED_STABILITY = 0.3;

export function plantOf(word: WordItem, now: number = Date.now()): Plant {
  const reviewed = (word.reviewCount || 0) > 0 || word.lastReviewed !== undefined || word.dueDate !== undefined;
  if (!reviewed) return { word, stage: "seed", health: null, thirst: "fresh" };

  const interval = word.intervalDays || 0;
  const stability = word.stability && word.stability > 0 ? word.stability : interval > 0 ? interval : JUST_FAILED_STABILITY;
  const last = word.lastReviewed ?? now;
  const health = retrievability(Math.max(0, (now - last) / DAY_MS), stability);
  const stage: PlantStage = word.status === "mastered" || interval >= MASTERED_INTERVAL_DAYS ? "bloom" : interval >= TREE_INTERVAL_DAYS ? "tree" : "sprout";
  const thirst: Thirst = health >= FRESH_AT ? "fresh" : health >= WILTED_BELOW ? "thirsty" : "wilted";
  return { word, stage, health, thirst };
}

export const emojiOf = (plant: Plant, skin: Skin = DEFAULT_SKIN): string => (plant.thirst === "wilted" ? skin.wilted : skin[plant.stage]);

const STAGE_ORDER: Record<PlantStage, number> = { bloom: 3, tree: 2, sprout: 1, seed: 0 };

/** Plants needing water first, then the most established ones. */
export function sortPlants(plants: Plant[]): Plant[] {
  const urgency = (p: Plant) => (p.health === null ? 2 : p.health);
  return [...plants].sort((a, b) => urgency(a) - urgency(b) || STAGE_ORDER[b.stage] - STAGE_ORDER[a.stage]);
}

export interface GardenSummary {
  total: number;
  stages: Record<PlantStage, number>;
  fresh: number;
  thirsty: number;
  wilted: number;
  health: number; // average recall chance across reviewed cards, 0..1 (0 when none)
}

export function summarize(plants: Plant[]): GardenSummary {
  const stages: Record<PlantStage, number> = { seed: 0, sprout: 0, tree: 0, bloom: 0 };
  let fresh = 0;
  let thirsty = 0;
  let wilted = 0;
  let sum = 0;
  let reviewed = 0;
  for (const p of plants) {
    stages[p.stage]++;
    if (p.health === null) continue;
    reviewed++;
    sum += p.health;
    if (p.thirst === "fresh") fresh++;
    else if (p.thirst === "thirsty") thirsty++;
    else wilted++;
  }
  return { total: plants.length, stages, fresh, thirsty, wilted, health: reviewed ? sum / reviewed : 0 };
}
