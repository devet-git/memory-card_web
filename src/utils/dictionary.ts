import { lookupBest, formatPos } from "utils/localDict";

// Free lookups (no API key): dictionaryapi.dev for phonetic/example, MyMemory for Vietnamese meaning.
export interface LookupResult {
  phonetic?: string;
  example?: string;
  translation?: string;
  mnemonic?: string; // only filled by AI
  definition?: string; // English definition from the offline dictionary
  baseForm?: string; // e.g. "go" for "went"
  translationSource?: "offline" | "online";
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function lookupEnglish(word: string): Promise<Pick<LookupResult, "phonetic" | "example">> {
  const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  const entry = Array.isArray(data) ? data[0] : null;
  if (!entry) return {};

  const phonetic: string | undefined =
    entry.phonetic || entry.phonetics?.find((p: any) => p?.text)?.text || undefined;

  let example: string | undefined;
  for (const meaning of entry.meanings || []) {
    for (const def of meaning.definitions || []) {
      if (def.example) {
        example = def.example;
        break;
      }
    }
    if (example) break;
  }
  return { phonetic, example };
}

async function translateToVietnamese(word: string): Promise<string | undefined> {
  const data = await fetchJson(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
  );
  const text: string | undefined = data?.responseData?.translatedText;
  if (!text || text.trim().toLowerCase() === word.trim().toLowerCase()) return undefined;
  return text.trim();
}

/**
 * Looks up an English word. The offline dictionary answers instantly (phonetic, English definition,
 * example); online services add the Vietnamese meaning and fill any gaps. Throws only if nothing is found.
 */
export async function lookupWord(word: string): Promise<LookupResult> {
  const clean = word.trim();
  if (!clean) return {};

  // Offline first: instant, works without a network. Online services only fill what's missing.
  const offline = await lookupBest(clean).catch(() => null);
  const [english, translation] = await Promise.allSettled([
    !offline || !offline.ipa || !offline.example ? lookupEnglish(clean) : Promise.resolve({}),
    offline?.vi ? Promise.resolve(undefined) : translateToVietnamese(clean)
  ]);

  const online = english.status === "fulfilled" ? (english.value as { phonetic?: string; example?: string }) : {};
  const onlineVi = translation.status === "fulfilled" ? translation.value : undefined;

  const result: LookupResult = {
    phonetic: offline?.ipa ? `/${offline.ipa}/` : online.phonetic,
    example: offline?.example || online.example,
    translation: offline?.vi || onlineVi,
    translationSource: offline?.vi ? "offline" : onlineVi ? "online" : undefined,
    definition: offline?.def ? `${offline.pos ? `(${formatPos(offline.pos)}) ` : ""}${offline.def}` : undefined,
    baseForm: offline?.base
  };

  if (!result.phonetic && !result.example && !result.translation && !result.definition) {
    throw new Error("Không tra được từ này (kiểm tra kết nối mạng hoặc chính tả)");
  }
  return result;
}
