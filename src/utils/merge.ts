import { mergeGameProfiles } from "utils/games";
import { mergeGrammar } from "utils/grammar";
import { CollectionItem, UserStats, WordItem } from "types";

/**
 * Deletions must travel with the data, otherwise merging a backup resurrects deleted cards.
 * A tombstone records WHEN something was deleted:
 *   decks:  deckKey            -> deletedAt
 *   words:  `${deckKey}::${id}` -> deletedAt
 * A copy that was touched after the tombstone (reviewed, re-added or moved back) survives it.
 */
export interface Tombstones {
  decks: Record<string, number>;
  words: Record<string, number>;
}

export const emptyTombstones = (): Tombstones => ({ decks: {}, words: {} });

const TOMBSTONE_MAX_AGE_MS = 90 * 86400000;

/** Decks are matched by their stable id when they have one (so renames merge cleanly), else by pathname. */
export const deckKey = (c: CollectionItem): string => c.id || c.pathname;
export const wordTombstoneKey = (deck: string, wordId: string | number): string => `${deck}::${wordId}`;

const maxMerge = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  Object.entries(b || {}).forEach(([k, v]) => {
    if (typeof v === "number" && v > (out[k] || 0)) out[k] = v;
  });
  return out;
};

export function mergeTombstones(a: Tombstones, b?: Partial<Tombstones> | null): Tombstones {
  return { decks: maxMerge(a.decks, b?.decks || {}), words: maxMerge(a.words, b?.words || {}) };
}

/** Forget tombstones older than 90 days (every device is assumed to have synced by then). */
export function pruneTombstones(t: Tombstones, now = Date.now()): Tombstones {
  const keep = (rec: Record<string, number>) => Object.fromEntries(Object.entries(rec).filter(([, ts]) => now - ts < TOMBSTONE_MAX_AGE_MS));
  return { decks: keep(t.decks), words: keep(t.words) };
}

export const normalizeTombstones = (raw: any): Tombstones => ({
  decks: raw && typeof raw.decks === "object" && raw.decks ? raw.decks : {},
  words: raw && typeof raw.words === "object" && raw.words ? raw.words : {}
});

const lastTouched = (w: WordItem) => Math.max(w.lastReviewed || 0, w.addedAt || 0);

function mergeWord(local: WordItem, remote: WordItem): WordItem {
  // The copy that was reviewed most recently wins; contents of the other fill in gaps
  const [winner, other] = lastTouched(remote) > lastTouched(local) ? [remote, local] : [local, remote];
  return { ...other, ...winner, starred: winner.starred || other.starred };
}

function mergeCollection(local: CollectionItem, remote: CollectionItem): CollectionItem {
  const remoteById = new Map(remote.words.map((w) => [String(w.id), w]));
  const seen = new Set<string>();
  const words: WordItem[] = local.words.map((w) => {
    const id = String(w.id);
    seen.add(id);
    const r = remoteById.get(id);
    return r ? mergeWord(w, r) : w;
  });
  remote.words.forEach((w) => {
    if (!seen.has(String(w.id))) words.push(w);
  });
  const newer = (remote.updatedAt || 0) > (local.updatedAt || 0) ? remote : local;
  return { ...newer, id: local.id || remote.id, words, updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0) || undefined };
}

/**
 * Union of two sets of collections (decks matched by id/pathname, cards by id), minus anything a
 * tombstone says was deleted after it was last touched. Nothing else is dropped.
 */
export function mergeCollections(local: CollectionItem[], remote: CollectionItem[], tombstones: Tombstones = emptyTombstones()): CollectionItem[] {
  const remoteByKey = new Map(remote.map((c) => [deckKey(c), c]));
  const usedRemote = new Set<string>();
  const merged: CollectionItem[] = [];

  const pushDeck = (deck: CollectionItem) => {
    const key = deckKey(deck);
    const deletedAt = tombstones.decks[key] || (deck.id ? tombstones.decks[deck.pathname] : 0) || 0;
    if (deletedAt && deletedAt > (deck.updatedAt || 0)) return; // deleted after its last change
    const words = deck.words.filter((w) => {
      const t = tombstones.words[wordTombstoneKey(key, w.id)] || 0;
      return !(t && t > lastTouched(w));
    });
    merged.push({ ...deck, words });
  };

  local.forEach((c) => {
    const key = deckKey(c);
    let r = remoteByKey.get(key);
    // legacy decks (no id) on one side and with id on the other still match by pathname
    if (!r) r = remote.find((x) => x.pathname === c.pathname && (!x.id || !c.id));
    if (r) usedRemote.add(deckKey(r));
    pushDeck(r ? mergeCollection(c, r) : c);
  });
  remote.forEach((c) => {
    if (!usedRemote.has(deckKey(c))) pushDeck(c);
  });
  return merged;
}

export function mergeStats(local: UserStats, remote: Partial<UserStats>): UserStats {
  const reviewLog: Record<string, number> = { ...(local.reviewLog || {}) };
  Object.entries(remote.reviewLog || {}).forEach(([day, n]) => {
    reviewLog[day] = Math.max(reviewLog[day] || 0, n);
  });
  const hourLog: Record<string, [number, number]> = { ...(local.hourLog || {}) };
  Object.entries(remote.hourLog || {}).forEach(([hour, [total, ok]]) => {
    const [t, o] = hourLog[hour] || [0, 0];
    hourLog[hour] = [Math.max(t, total), Math.max(o, ok)];
  });
  const frozenDays = Array.from(new Set([...(local.frozenDays || []), ...(remote.frozenDays || [])])).sort().slice(-60);
  const remoteIsNewer = (remote.lastStudyDate || "") > local.lastStudyDate;
  const newerFreezeMonth = (remote.freezeMonth || "") > (local.freezeMonth || "");
  return {
    ...local,
    studyStreakDays: remoteIsNewer ? remote.studyStreakDays ?? local.studyStreakDays : local.studyStreakDays,
    lastStudyDate: remoteIsNewer ? remote.lastStudyDate || local.lastStudyDate : local.lastStudyDate,
    totalCardsReviewed: Math.max(local.totalCardsReviewed, remote.totalCardsReviewed || 0),
    quizzesCompleted: Math.max(local.quizzesCompleted, remote.quizzesCompleted || 0),
    freezes: newerFreezeMonth || remoteIsNewer ? remote.freezes ?? local.freezes : local.freezes,
    freezeMonth: newerFreezeMonth ? remote.freezeMonth : local.freezeMonth,
    frozenDays,
    reviewLog,
    hourLog,
    games: mergeGameProfiles(local.games, remote.games),
    grammar: mergeGrammar(local.grammar, remote.grammar)
  };
}
