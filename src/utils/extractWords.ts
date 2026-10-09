// Finds study candidates in a pasted passage: the words the learner doesn't have yet, grouped by base form
// ("went", "going" -> "go") and paired with the sentence they appeared in.

export interface Candidate {
  word: string; // base form
  forms: string[]; // surface forms seen in the text, lowercase
  count: number; // occurrences of any form
  sentence: string; // first sentence containing the word, as written
}

export const MAX_TEXT_LENGTH = 150000; // a whole film's subtitles
const MIN_LENGTH = 3;
const MAX_SENTENCE = 220;

const STOPWORDS = new Set(
  (
    "the and for are but not you all any can had her was one our out has him his how its may new now old see two way who did get " +
    "let put say she too use that with have this will your from they know want been were said each which their time there what about " +
    "would make like into than then them these some could other more also when where while who whom whose why because been being does " +
    "doing done just only over such very much many most even here after before again once both few own same should shall might must " +
    "off out through under until upon within without across against among around between during per via yet nor either neither " +
    "isn aren wasn weren don doesn didn won wouldn couldn shouldn hasn haven hadn can't won't"
  ).split(/\s+/)
);

export const isStopword = (w: string) => STOPWORDS.has(w);

/** English word tokens with their position; possessive "'s" and contractions are cut off. */
export function tokenize(text: string): { token: string; index: number }[] {
  const out: { token: string; index: number }[] = [];
  for (const m of Array.from(text.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)*/g))) {
    const token = m[0].replace(/['’][A-Za-z]+$/, "").toLowerCase();
    if (token.length >= MIN_LENGTH) out.push({ token, index: m.index ?? 0 });
  }
  return out;
}

/** Splits a passage into sentences, keeping each one's start offset. */
export function splitSentences(text: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  const re = /[^.!?\n]+(?:[.!?]+["')\]]*|\n|$)/g;
  for (const m of Array.from(text.matchAll(re))) {
    const raw = m[0];
    const trimmed = raw.trim();
    if (trimmed) out.push({ text: trimmed, start: (m.index ?? 0) + raw.indexOf(trimmed) });
  }
  return out;
}

const clip = (s: string, word: string): string => {
  if (s.length <= MAX_SENTENCE) return s;
  const at = Math.max(0, s.toLowerCase().indexOf(word.toLowerCase()));
  const from = Math.max(0, at - Math.floor(MAX_SENTENCE / 2));
  return (from > 0 ? "…" : "") + s.slice(from, from + MAX_SENTENCE).trim() + "…";
};

/**
 * Candidate words of `text`, most frequent first.
 * `baseOf` maps a surface form to its base form; `have` holds lowercase words to leave out.
 */
export function extractCandidates(text: string, baseOf: (w: string) => string, have: Set<string> = new Set()): Candidate[] {
  const body = text.slice(0, MAX_TEXT_LENGTH);
  const sentences = splitSentences(body);
  const byBase = new Map<string, Candidate>();

  // Tokens come in text order, so one moving pointer finds each token's sentence (no rescanning from the start)
  let si = 0;
  const sentenceAt = (index: number) => {
    while (si + 1 < sentences.length && sentences[si + 1].start <= index) si++;
    return sentences[si]?.text || "";
  };

  for (const { token, index } of tokenize(body)) {
    const base = baseOf(token) || token;
    if (isStopword(token) || isStopword(base) || have.has(token) || have.has(base)) continue;
    let c = byBase.get(base);
    if (!c) {
      c = { word: base, forms: [], count: 0, sentence: clip(sentenceAt(index), token) };
      byBase.set(base, c);
    }
    c.count++;
    if (!c.forms.includes(token)) c.forms.push(token);
  }
  return Array.from(byBase.values()).sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

/**
 * Plain text from a subtitle file (.srt / .vtt / .ass-like text): drops cue numbers, timestamps, headers,
 * markup and sound cues, and joins cue lines into running text so sentences stay whole.
 */
export function subtitleToText(raw: string): string {
  const lines = raw
    .replace(/\r/g, "")
    .replace(/^\uFEFF/, "")
    .split("\n");
  const out: string[] = [];
  let last = "";
  for (const line of lines) {
    let t = line.trim();
    if (!t || /^WEBVTT/i.test(t) || /^(NOTE|STYLE|REGION)\b/.test(t) || /^\d+$/.test(t) || /-->/.test(t)) continue;
    t = t
      .replace(/<[^>]*>/g, "") // <i>, <font ...>, <00:00:01.000>
      .replace(/\{\\[^}]*\}/g, "") // {\an8}
      .replace(/\[[^\]]*\]|\([^)]*\)/g, "") // [music] (laughs)
      .replace(/[♪♫]+/g, "")
      .replace(/^[-–—]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!t || t === last) continue; // empty after cleanup, or the same line repeated by the next cue
    last = t;
    out.push(t);
  }
  return out.join(" ");
}
