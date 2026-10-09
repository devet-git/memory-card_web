import { CollectionItem, WordItem } from "types";
import { removeAccent } from "utils/removeAccent";
import { deckKey } from "utils/merge";

// Deleted cards and decks stay recoverable on this device for a while. The trash is local only:
// it is not synced, and emptying it never affects other devices.

export const TRASH_DAYS = 30;
export const MAX_TRASH = 400;
const DAY_MS = 86400000;

export interface TrashEntry {
  id: string;
  kind: "word" | "deck";
  deletedAt: number;
  deckKey: string; // stable key of the deck (the deck itself for a deck entry)
  deckName: string;
  word?: WordItem;
  deck?: CollectionItem;
}

export const daysLeft = (e: TrashEntry, now = Date.now()) => Math.max(0, Math.ceil(TRASH_DAYS - (now - e.deletedAt) / DAY_MS));

/** Drops expired entries and keeps the newest MAX_TRASH. */
export function pruneTrash(entries: TrashEntry[], now = Date.now()): TrashEntry[] {
  return entries
    .filter((e) => now - e.deletedAt < TRASH_DAYS * DAY_MS)
    .sort((a, b) => b.deletedAt - a.deletedAt)
    .slice(0, MAX_TRASH);
}

let counter = 0;
const entryId = (now: number) => `t-${now}-${counter++}-${Math.random().toString(36).slice(2, 6)}`;

export function trashWords(entries: TrashEntry[], deck: CollectionItem, words: WordItem[], now = Date.now()): TrashEntry[] {
  if (words.length === 0) return entries;
  const added = words.map<TrashEntry>((word) => ({ id: entryId(now), kind: "word", deletedAt: now, deckKey: deckKey(deck), deckName: deck.name, word }));
  return pruneTrash([...added, ...entries], now);
}

export function trashDeck(entries: TrashEntry[], deck: CollectionItem, now = Date.now()): TrashEntry[] {
  return pruneTrash([{ id: entryId(now), kind: "deck", deletedAt: now, deckKey: deckKey(deck), deckName: deck.name, deck }, ...entries], now);
}

export interface RestoreResult {
  collections: CollectionItem[];
  error?: string;
  /** Tombstone keys to forget so the restored item is not deleted again by a sync. */
  forget?: { deck?: string; word?: string };
}

/** Puts a trashed item back. Items are stamped "now" so they win against the deletion record on other devices. */
export function restoreEntry(collections: CollectionItem[], entry: TrashEntry, now = Date.now()): RestoreResult {
  if (entry.kind === "word" && entry.word) {
    const deck = collections.find((c) => deckKey(c) === entry.deckKey);
    if (!deck) return { collections, error: `Bộ thẻ “${entry.deckName}” đã bị xóa. Hãy khôi phục bộ thẻ trước.` };
    const word = { ...entry.word, addedAt: now };
    const exists = deck.words.some((w) => String(w.id) === String(word.id));
    const next = exists
      ? collections
      : collections.map((c) => (c === deck ? { ...c, updatedAt: now, words: [word, ...c.words] } : c));
    return { collections: next, forget: { word: `${entry.deckKey}::${word.id}` } };
  }

  if (entry.kind === "deck" && entry.deck) {
    if (collections.some((c) => deckKey(c) === entry.deckKey)) return { collections, error: "Bộ thẻ này đã tồn tại." };
    let name = entry.deck.name;
    let pathname = entry.deck.pathname;
    const taken = (n: string, p: string) => collections.some((c) => c.name.toLowerCase() === n.toLowerCase() || c.pathname === p);
    if (taken(name, pathname)) {
      name = `${entry.deck.name} (khôi phục)`;
      let n = 2;
      while (taken(name, removeAccent(name))) name = `${entry.deck.name} (khôi phục ${n++})`;
      pathname = removeAccent(name);
    }
    const restored: CollectionItem = { ...entry.deck, name, pathname, updatedAt: now };
    return { collections: [restored, ...collections], forget: { deck: deckKey(entry.deck) } };
  }
  return { collections, error: "Mục này không còn dữ liệu để khôi phục." };
}
