// Turns the AI's reading of a photo into clean vocabulary drafts.

export interface VisionWord {
  word: string;
  meaning: string;
  example: string;
}

export const MAX_VISION_WORDS = 40;
const MAX_WORD = 40;
const MAX_MEANING = 140;
const MAX_EXAMPLE = 220;

export const VISION_SYSTEM = `You read photos of study material for Vietnamese learners of English: a book page, menu, sign, slide, label or handwritten notes.
Extract the useful English vocabulary that is actually visible in the image: single words and short phrases in dictionary form (singular nouns, base verbs). Skip proper nouns, numbers, brand names and very common words (the, is, and, of...).
Return a JSON array of at most ${MAX_VISION_WORDS} items: {"word": the term, "meaning": its concise Vietnamese meaning as used in the image, "example": the short line from the image that contains it, or ""}.
If the image has no readable English text, return [].`;

export const VISION_PROMPT = "Extract the vocabulary a learner should study from this image.";

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Accepts the loosely-shaped JSON a model returns; keeps only usable, new, distinct items. */
export function parseVisionWords(raw: unknown, existing: Set<string> = new Set()): VisionWord[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as any).words) ? (raw as any).words : [];
  const seen = new Set<string>();
  const out: VisionWord[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const word = clean(item.word ?? item.source ?? item.term, MAX_WORD).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.?!]+$/gu, "");
    const meaning = clean(item.meaning ?? item.target ?? item.vi, MAX_MEANING);
    if (!word || !meaning || word.length < 2) continue;
    const key = word.toLowerCase();
    if (seen.has(key) || existing.has(key)) continue;
    seen.add(key);
    out.push({ word, meaning, example: clean(item.example, MAX_EXAMPLE) });
    if (out.length >= MAX_VISION_WORDS) break;
  }
  return out;
}
