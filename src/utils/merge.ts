import { CollectionItem, UserStats, WordItem } from "types";

const lastTouched = (w: WordItem) => w.lastReviewed || 0;

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
  return { ...newer, words, updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0) || undefined };
}

/** Union of two sets of collections (matched by pathname, words by id). Nothing is dropped. */
export function mergeCollections(local: CollectionItem[], remote: CollectionItem[]): CollectionItem[] {
  const remoteByPath = new Map(remote.map((c) => [c.pathname, c]));
  const seen = new Set<string>();
  const merged = local.map((c) => {
    seen.add(c.pathname);
    const r = remoteByPath.get(c.pathname);
    return r ? mergeCollection(c, r) : c;
  });
  remote.forEach((c) => {
    if (!seen.has(c.pathname)) merged.push(c);
  });
  return merged;
}

export function mergeStats(local: UserStats, remote: Partial<UserStats>): UserStats {
  const reviewLog: Record<string, number> = { ...(local.reviewLog || {}) };
  Object.entries(remote.reviewLog || {}).forEach(([day, n]) => {
    reviewLog[day] = Math.max(reviewLog[day] || 0, n);
  });
  const remoteIsNewer = (remote.lastStudyDate || "") > local.lastStudyDate;
  return {
    ...local,
    studyStreakDays: remoteIsNewer ? remote.studyStreakDays ?? local.studyStreakDays : local.studyStreakDays,
    lastStudyDate: remoteIsNewer ? remote.lastStudyDate || local.lastStudyDate : local.lastStudyDate,
    totalCardsReviewed: Math.max(local.totalCardsReviewed, remote.totalCardsReviewed || 0),
    quizzesCompleted: Math.max(local.quizzesCompleted, remote.quizzesCompleted || 0),
    reviewLog
  };
}
