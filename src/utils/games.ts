import { DailyResult, GameProfile, UserStats, WordItem } from "types";
import type { DictEntry } from "utils/localDict";
import { pickDistractors } from "utils/distractors";
import { addDays } from "utils/streak";

// ---------- shared: profile, coins, records ----------

export const emptyProfile = (): GameProfile => ({ coins: 0, played: 0, best: {}, daily: {} });
export const profileOf = (stats: UserStats): GameProfile => ({ ...emptyProfile(), ...(stats.games || {}) });

export interface GameResult {
  game: string; // record key, e.g. "tf", "memory-8", "wordle"
  score: number;
  coins: number;
  daily?: { date: string; result: DailyResult };
}

const KEEP_DAILY = 120;

/** Adds a finished game to the stats: coins, play count, personal best and the daily history. */
export function applyGameResult(stats: UserStats, result: GameResult): UserStats {
  const g = profileOf(stats);
  const daily = { ...g.daily };
  if (result.daily && !daily[result.daily.date]) daily[result.daily.date] = result.daily.result;
  const keys = Object.keys(daily).sort();
  keys.slice(0, Math.max(0, keys.length - KEEP_DAILY)).forEach((k) => delete daily[k]);
  return {
    ...stats,
    games: {
      coins: g.coins + Math.max(0, Math.round(result.coins)),
      played: g.played + 1,
      best: { ...g.best, [result.game]: Math.max(g.best[result.game] || 0, result.score) },
      daily
    }
  };
}

export const isNewBest = (stats: UserStats, game: string, score: number) => score > 0 && score > (profileOf(stats).best[game] || 0);

/** Consecutive days with a WON daily challenge, counting back from today (or yesterday if today isn't played yet). */
export function dailyStreak(daily: Record<string, DailyResult>, today: string): number {
  let day = daily[today]?.won ? today : addDays(today, -1);
  let streak = 0;
  while (daily[day]?.won) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export const dailyWins = (daily: Record<string, DailyResult>) => Object.values(daily).filter((d) => d.won).length;

export function mergeGameProfiles(a: GameProfile | undefined, b: GameProfile | undefined): GameProfile | undefined {
  if (!a && !b) return undefined;
  const x = { ...emptyProfile(), ...a };
  const y = { ...emptyProfile(), ...b };
  const best: Record<string, number> = { ...x.best };
  Object.entries(y.best).forEach(([k, v]) => (best[k] = Math.max(best[k] || 0, v)));
  return { coins: Math.max(x.coins, y.coins), played: Math.max(x.played, y.played), best, daily: { ...y.daily, ...x.daily } };
}

/** First meaning of a dictionary-style definition, without the part-of-speech tag: "(n.) a; b" -> "a". */
export function firstMeaning(target: string): string {
  const cleaned = target.replace(/^\s*\([^)]*\)\s*/, "");
  return (cleaned.split(/[;\n]/)[0] || cleaned).trim();
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- word guess (Wordle-style) ----------

export type LetterState = "correct" | "present" | "absent";
export const WORDLE_ATTEMPTS = 6;
export const DAILY_LENGTH = 5;

/** Standard Wordle marking, including repeated letters. */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: LetterState[] = Array.from({ length: g.length }, () => "absent");
  const left: Record<string, number> = {};
  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) result[i] = "correct";
    else left[a[i]] = (left[a[i]] || 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    if (left[g[i]] > 0) {
      result[i] = "present";
      left[g[i]]--;
    }
  }
  return result;
}

/** Best known state of each typed letter, for colouring the on-screen keyboard. */
export function keyboardStates(rows: { guess: string; states: LetterState[] }[]): Record<string, LetterState> {
  const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, LetterState> = {};
  for (const row of rows) {
    row.guess.split("").forEach((ch, i) => {
      const prev = out[ch];
      if (!prev || rank[row.states[i]] > rank[prev]) out[ch] = row.states[i];
    });
  }
  return out;
}

const EMOJI: Record<LetterState, string> = { correct: "🟩", present: "🟨", absent: "⬛" };
export const gridOf = (rows: LetterState[][]) => rows.map((r) => r.map((s) => EMOJI[s]).join("")).join("\n");

export function shareText(date: string, won: boolean, guesses: number, grid: string): string {
  return `MemCard Đoán chữ ${date} ${won ? guesses : "X"}/${WORDLE_ATTEMPTS}\n${grid}`;
}

/** Deterministic hash (FNV-1a) so everyone gets the same daily word without a server. */
export function dailyIndex(dayKey: string, size: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return size > 0 ? h % size : 0;
}

/** Common 5-letter base words with a Vietnamese meaning, in the order of the offline dictionary. */
export const dailyPool = (top: DictEntry[]): DictEntry[] =>
  top.filter((e) => /^[a-z]{5}$/.test(e.word) && e.vi && !e.lemma && e.rank >= 200 && e.rank <= 3000);

export const pickDailyWord = (top: DictEntry[], dayKey: string): DictEntry | null => {
  const pool = dailyPool(top);
  return pool.length ? pool[dailyIndex(dayKey, pool.length)] : null;
};

/** Deck cards that fit on the board: one plain word of 3-8 letters. */
export const wordleWords = (words: WordItem[]): WordItem[] => words.filter((w) => /^[A-Za-z]{3,8}$/.test(w.source.trim()));

export function wordleCoins(opts: { won: boolean; guesses: number; hint: boolean; daily: boolean }): number {
  if (!opts.won) return opts.daily ? 1 : 0;
  const base = 4 + (WORDLE_ATTEMPTS - opts.guesses) * 2 - (opts.hint ? 2 : 0);
  return Math.max(1, base) * (opts.daily ? 2 : 1);
}

export const wordleScore = (won: boolean, guesses: number, hint: boolean) => (won ? Math.max(1, (WORDLE_ATTEMPTS + 1 - guesses) * 10 - (hint ? 5 : 0)) : 0);

// ---------- true / false sprint ----------

export const TF_SECONDS = 60;
export const TF_WRONG_PENALTY_MS = 2000;
export const TF_MIN_WORDS = 4;

export interface TfQuestion {
  word: WordItem;
  shown: string; // the meaning displayed next to the term
  truth: boolean;
}

export const tfMultiplier = (streak: number) => Math.min(4, 1 + Math.floor(streak / 5));
export const tfPoints = (streakBefore: number) => 10 * tfMultiplier(streakBefore);
export const tfCoins = (score: number) => Math.floor(score / 20);

/** Half the questions show the real meaning, half a believable wrong one from another card. */
export function makeTfQuestion(word: WordItem, pool: WordItem[], rng: () => number = Math.random): TfQuestion {
  const real = firstMeaning(word.target);
  if (rng() < 0.5) return { word, shown: real, truth: true };
  const others = pool
    .filter((w) => w.id !== word.id && firstMeaning(w.target).toLowerCase() !== real.toLowerCase())
    .map((w) => ({ text: firstMeaning(w.target) }));
  const picks = pickDistractors({ text: real }, others, 3, rng);
  if (picks.length === 0) return { word, shown: real, truth: true };
  return { word, shown: picks[Math.floor(rng() * picks.length)], truth: false };
}

// ---------- memory flip ----------

export const MEMORY_LEVELS = [
  { pairs: 6, label: "Dễ", cols: 4 },
  { pairs: 8, label: "Vừa", cols: 4 },
  { pairs: 12, label: "Khó", cols: 6 }
] as const;
export const MEMORY_MIN_PAIRS = 4;

export interface MemoryCard {
  key: string;
  pairId: string;
  side: "term" | "meaning";
  text: string;
}

const fitsCard = (w: WordItem) => w.source.trim().length > 0 && w.source.trim().length <= 22 && firstMeaning(w.target).length > 0 && firstMeaning(w.target).length <= 36;

/** A shuffled board of `pairs` term/meaning pairs (fewer if the deck has fewer usable cards). */
export function buildMemoryCards(words: WordItem[], pairs: number, rng: () => number = Math.random): MemoryCard[] {
  const seen = new Set<string>();
  const usable = words.filter(fitsCard).filter((w) => {
    const k = w.source.trim().toLowerCase();
    const m = firstMeaning(w.target).toLowerCase();
    if (seen.has(k) || seen.has("m:" + m)) return false;
    seen.add(k);
    seen.add("m:" + m);
    return true;
  });
  const picked = shuffle(usable, rng).slice(0, pairs);
  return shuffle(
    picked.flatMap((w) => [
      { key: `${w.id}-t`, pairId: String(w.id), side: "term" as const, text: w.source.trim() },
      { key: `${w.id}-m`, pairId: String(w.id), side: "meaning" as const, text: firstMeaning(w.target) }
    ]),
    rng
  );
}

export function memoryScore(pairs: number, moves: number, seconds: number): number {
  const extraMoves = Math.max(0, moves - pairs);
  return Math.max(0, pairs * 100 - extraMoves * 10 + Math.max(0, pairs * 8 - seconds));
}

export const memoryStars = (pairs: number, moves: number) => (moves <= pairs * 1.5 ? 3 : moves <= pairs * 2.4 ? 2 : 1);
export const memoryCoins = (pairs: number, moves: number) => Math.round(pairs * memoryStars(pairs, moves) * 0.7);
