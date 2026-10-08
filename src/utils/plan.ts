import { CollectionItem, WordItem } from "types";
import { isDue, isNewCard, NEW_CARDS_PER_SESSION } from "utils/srs";

// A "leech" keeps being forgotten: it deserves a different way of learning, not just more repeats.
export const LEECH_LAPSES = 4;
export const LEECH_WRONG = 6;
export const LEECHES_PER_SESSION = 5;
export const LEECH_ONLY_LIMIT = 30;
export const REVERSE_MIN_INTERVAL_DAYS = 7;
export const REVERSE_CHANCE = 0.4;

export const isLeech = (w: WordItem): boolean => (w.lapses || 0) >= LEECH_LAPSES || (w.wrongCount || 0) >= LEECH_WRONG;

export interface PlanItem {
  pathname: string;
  wordId: string | number;
  kind: "due" | "leech" | "new";
  reversed?: boolean; // ask meaning -> term for well-known cards
}

export interface DailyPlan {
  items: PlanItem[];
  due: number; // cards whose review date has come
  leeches: number; // extra leech practice added to the session (leeches that are not already due)
  fresh: number; // new cards introduced
  leechTotal: number; // all leeches in scope, whether or not they are in this session
}

interface PlanOptions {
  deck?: string | null; // only this collection (pathname)
  now?: number;
  newLimit?: number;
  leechLimit?: number;
  onlyLeeches?: boolean; // practice session with just the leeches
  reverse?: boolean; // allow reversed prompts for well-known cards
  random?: () => number;
}

/**
 * Today's session: overdue cards first (most overdue first), then a few leeches that are not due yet,
 * then new cards. Due cards that are well known are sometimes asked back-to-front.
 */
export function buildDailyPlan(collections: CollectionItem[], opts: PlanOptions = {}): DailyPlan {
  const now = opts.now ?? Date.now();
  const random = opts.random ?? Math.random;
  const newLimit = opts.newLimit ?? NEW_CARDS_PER_SESSION;
  const leechLimit = opts.leechLimit ?? LEECHES_PER_SESSION;

  type Entry = { pathname: string; word: WordItem };
  const due: Entry[] = [];
  const leechExtras: Entry[] = [];
  const fresh: Entry[] = [];
  const allLeeches: Entry[] = [];

  collections.forEach((c) => {
    if (opts.deck && c.pathname !== opts.deck) return;
    c.words.forEach((w) => {
      const entry = { pathname: c.pathname, word: w };
      const leech = isLeech(w);
      if (leech) allLeeches.push(entry);
      if (isDue(w, now)) due.push(entry);
      else if (leech) leechExtras.push(entry);
      else if (isNewCard(w)) fresh.push(entry);
    });
  });

  const byWrong = (a: Entry, b: Entry) => (b.word.wrongCount || 0) - (a.word.wrongCount || 0);

  if (opts.onlyLeeches) {
    const items = [...allLeeches].sort(byWrong).slice(0, LEECH_ONLY_LIMIT).map<PlanItem>((e) => ({ pathname: e.pathname, wordId: e.word.id, kind: "leech" }));
    return { items, due: 0, leeches: items.length, fresh: 0, leechTotal: allLeeches.length };
  }

  due.sort((a, b) => (a.word.dueDate || 0) - (b.word.dueDate || 0));
  const extras = leechExtras.sort(byWrong).slice(0, leechLimit);
  const news = fresh.slice(0, newLimit);

  const items: PlanItem[] = [
    ...due.map<PlanItem>((e) => ({
      pathname: e.pathname,
      wordId: e.word.id,
      kind: "due",
      // Leeches are never reversed: they need the easy direction first
      reversed: Boolean(opts.reverse) && !isLeech(e.word) && (e.word.intervalDays || 0) >= REVERSE_MIN_INTERVAL_DAYS && random() < REVERSE_CHANCE
    })),
    ...extras.map<PlanItem>((e) => ({ pathname: e.pathname, wordId: e.word.id, kind: "leech" })),
    ...news.map<PlanItem>((e) => ({ pathname: e.pathname, wordId: e.word.id, kind: "new" }))
  ];

  return { items, due: due.length, leeches: extras.length, fresh: news.length, leechTotal: allLeeches.length };
}
