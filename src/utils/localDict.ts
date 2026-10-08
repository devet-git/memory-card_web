// Offline dictionary (see scripts/build-dict.mjs). Data lives in public/dict as small shards
// keyed by the first two letters, fetched on demand and cached in memory (and by the service worker).

export interface DictEntry {
  word: string;
  ipa: string; // without slashes
  pos: string; // letters from "nvar"
  def: string; // English definition
  example: string;
  rank: number; // 1 = most common
  lemma: string; // base form when this word is inflected ("" otherwise)
}

type RawEntry = [string?, string?, string?, string?, number?, string?];
type Shard = Record<string, RawEntry>;

const BASE = `${process.env.PUBLIC_URL || ""}/dict`;
const shardCache = new Map<string, Promise<Shard>>();
let metaPromise: Promise<Set<string>> | null = null;
const loaded = new Map<string, Shard>(); // resolved shards for synchronous reads

const shardKey = (w: string) => (w.length >= 2 ? w.slice(0, 2) : `${w}_`);
const clean = (w: string) => w.trim().toLowerCase();

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T; // a SPA fallback page fails to parse and lands in the catch
  } catch {
    return null;
  }
}

function getKnownShards(): Promise<Set<string>> {
  if (!metaPromise) {
    metaPromise = fetchJson<{ shards: string[] }>(`${BASE}/meta.json`).then((m) => new Set(m?.shards || []));
  }
  return metaPromise;
}

function loadShard(key: string): Promise<Shard> {
  let p = shardCache.get(key);
  if (!p) {
    p = getKnownShards().then(async (known) => {
      if (!known.has(key)) return {};
      const shard = (await fetchJson<Shard>(`${BASE}/${key}.json`)) || {};
      loaded.set(key, shard);
      return shard;
    });
    shardCache.set(key, p);
  }
  return p;
}

const toEntry = (word: string, raw: RawEntry): DictEntry => ({
  word,
  ipa: raw[0] || "",
  pos: raw[1] || "",
  def: raw[2] || "",
  example: raw[3] || "",
  rank: raw[4] || 0,
  lemma: raw[5] || ""
});

export const POS_LABELS: Record<string, string> = { n: "danh từ", v: "động từ", a: "tính từ", r: "trạng từ" };
export const POS_SHORT: Record<string, string> = { n: "n.", v: "v.", a: "adj.", r: "adv." };

export const formatPos = (pos: string) => pos.split("").map((p) => POS_SHORT[p]).filter(Boolean).join(" / ");

export const rankTier = (rank: number): string =>
  rank <= 0 ? "" : rank <= 1500 ? "Rất phổ biến" : rank <= 6000 ? "Phổ biến" : rank <= 20000 ? "Trung bình" : "Ít gặp";

/** Exact lookup (case-insensitive). Resolves to null when the word isn't in the dictionary. */
export async function lookupLocal(word: string): Promise<DictEntry | null> {
  const w = clean(word);
  if (!/^[a-z]{2,}$/.test(w)) return null;
  const shard = await loadShard(shardKey(w));
  return shard[w] ? toEntry(w, shard[w]) : null;
}

/** Entry plus its base-form entry, e.g. "running" -> also "run" (whose definition is usually better). */
export async function lookupWithBase(word: string): Promise<{ entry: DictEntry; base: DictEntry | null } | null> {
  const entry = await lookupLocal(word);
  if (!entry) return null;
  const base = entry.lemma ? await lookupLocal(entry.lemma) : null;
  return { entry, base };
}

/** Best offline data for a word, using the base form when the word itself has no definition. */
export async function lookupBest(word: string): Promise<{ ipa: string; pos: string; def: string; example: string; base?: string } | null> {
  const hit = await lookupWithBase(word);
  if (!hit) return null;
  const { entry, base } = hit;
  const useBase = Boolean(base && base.def && (!entry.def || entry.lemma));
  return {
    ipa: entry.ipa,
    pos: useBase ? base!.pos : entry.pos,
    def: useBase ? base!.def : entry.def,
    example: entry.example || (base?.example ?? ""),
    base: entry.lemma || undefined
  };
}

/** Words starting with `prefix` (min 2 letters), most common first. */
export async function suggestWords(prefix: string, limit = 6): Promise<DictEntry[]> {
  const p = clean(prefix);
  if (!/^[a-z]{2,}$/.test(p)) return [];
  const shard = await loadShard(p.slice(0, 2));
  return Object.keys(shard)
    .filter((w) => w.startsWith(p))
    .sort((a, b) => (shard[a][4] || 1e9) - (shard[b][4] || 1e9))
    .slice(0, limit)
    .map((w) => toEntry(w, shard[w]));
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** "Did you mean": close spellings of an unknown word (typos in the first two letters aren't caught). */
export async function suggestSpelling(word: string, limit = 4): Promise<DictEntry[]> {
  const w = clean(word);
  if (!/^[a-z]{3,}$/.test(w)) return [];
  const max = w.length <= 4 ? 1 : 2;
  const keys = new Set([w.slice(0, 2), w[1] + w[0]]);
  const found: { entry: DictEntry; dist: number }[] = [];
  for (const k of Array.from(keys)) {
    const shard = await loadShard(k);
    for (const cand of Object.keys(shard)) {
      const d = editDistance(w, cand, max);
      if (d > 0 && d <= max) found.push({ entry: toEntry(cand, shard[cand]), dist: d });
    }
  }
  return found
    .sort((a, b) => a.dist - b.dist || (a.entry.rank || 1e9) - (b.entry.rank || 1e9))
    .slice(0, limit)
    .map((f) => f.entry);
}

/** Makes later synchronous `baseFormSync` calls work for these words. */
export async function prefetch(words: string[]): Promise<void> {
  const keys = new Set(words.map(clean).filter((w) => /^[a-z]{2,}$/.test(w)).map(shardKey));
  await Promise.all(Array.from(keys).map(loadShard));
}

/** Base form of an inflected word if its shard is already loaded ("went" -> "go"); otherwise the word itself. */
export function baseFormSync(word: string): string {
  const w = clean(word);
  const raw = loaded.get(shardKey(w))?.[w];
  return (raw && raw[5]) || w;
}

let topPromise: Promise<DictEntry[]> | null = null;
/** The ~3000 most common words, in rank order. */
export function loadTopWords(): Promise<DictEntry[]> {
  if (!topPromise) {
    topPromise = fetchJson<[string, ...RawEntry][]>(`${BASE}/top.json`).then((rows) =>
      (rows || []).map((r) => toEntry(r[0] as string, r.slice(1) as RawEntry))
    );
  }
  return topPromise;
}
