import { WordItem } from "types";
import { isLeech } from "utils/plan";

export interface Scenario {
  id: string;
  icon: string;
  title: string;
  setup: string; // English description of the situation for the AI
}

export const SCENARIOS: Scenario[] = [
  { id: "restaurant", icon: "🍽️", title: "Gọi món ở nhà hàng", setup: "The learner is a customer ordering food at a restaurant. You are the waiter." },
  { id: "interview", icon: "💼", title: "Phỏng vấn xin việc", setup: "The learner is a job candidate. You are a friendly hiring manager running the interview." },
  { id: "directions", icon: "🧭", title: "Hỏi đường", setup: "The learner is a tourist who is lost in a city. You are a helpful local." },
  { id: "hotel", icon: "🏨", title: "Đặt phòng khách sạn", setup: "The learner is checking in at a hotel. You are the receptionist." },
  { id: "shopping", icon: "🛍️", title: "Mua sắm", setup: "The learner is shopping for clothes. You are the shop assistant." },
  { id: "doctor", icon: "🩺", title: "Đi khám bệnh", setup: "The learner is a patient describing symptoms. You are a kind doctor." }
];

export const MAX_TARGET_WORDS = 8;
export const MAX_TURNS = 10;
export const HISTORY_WINDOW = 12;

export interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

export interface TurnResult {
  reply: string;
  correction?: string | null;
  improved?: string | null;
  misused?: string[];
}

/** Picks the words to practise: struggling cards first, then random ones. */
export function pickTargetWords(words: WordItem[], count = MAX_TARGET_WORDS, rng: () => number = Math.random): WordItem[] {
  const usable = words.filter((w) => w.source.trim());
  const shuffle = (list: WordItem[]) => {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const hard = shuffle(usable.filter((w) => isLeech(w) || (w.wrongCount || 0) > 0));
  const rest = shuffle(usable.filter((w) => !hard.includes(w)));
  return [...hard, ...rest].slice(0, count);
}

export function buildSystemPrompt(situation: string, targets: WordItem[]): string {
  const list = targets.map((w) => `"${w.source}" (${w.target})`).join(", ");
  return `You are a role-play partner helping a Vietnamese learner practise English conversation.
Situation: ${situation}
Speak only English, in short natural turns (1-3 sentences) and ask one question at a time so the learner keeps talking.
Steer the conversation so the learner has a natural chance to use these target words: ${list}. Never list or explain the words; do not use the target words yourself more than needed.
After each learner message, return JSON:
{"reply": your next line in English,
 "correction": a short Vietnamese note on the learner's mistakes in their LAST message (grammar, word choice), or null if it was fine,
 "improved": a more natural version of their last message, or null if no change is needed,
 "misused": array of target words (exactly as listed) the learner used INCORRECTLY in their last message, or []}
Be encouraging; ignore capitalisation and minor typos.`;
}

export function buildTurnPrompt(history: ChatMessage[], learnerMessage?: string): string {
  const recent = history.slice(-HISTORY_WINDOW);
  const lines = recent.map((m) => `${m.role === "ai" ? "You" : "Learner"}: ${m.text}`).join("\n");
  if (learnerMessage === undefined) {
    return `${lines ? lines + "\n" : ""}Start the role-play now with your opening line. Set "correction", "improved" to null and "misused" to [].`;
  }
  return `${lines}\nLearner: ${learnerMessage.slice(0, 600)}\nRespond as instructed.`;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Target words that appear in the learner's message. Single words also match inflected forms
 * ("went" for "go") through `baseOf`; phrases must appear as written.
 */
export function findUsedWords(text: string, targets: WordItem[], baseOf: (w: string) => string): WordItem[] {
  const tokens = Array.from(text.matchAll(/\p{L}+/gu)).map((m) => m[0].toLowerCase());
  const bases = tokens.map(baseOf);
  return targets.filter((w) => {
    const src = w.source.trim().toLowerCase();
    if (!src) return false;
    if (/\s/.test(src)) return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(src)}(?![\\p{L}\\p{N}])`, "iu").test(text);
    const srcBase = baseOf(src);
    return tokens.some((t, i) => t === src || bases[i] === src || t === srcBase || (bases[i] === srcBase && bases[i] !== t));
  });
}
