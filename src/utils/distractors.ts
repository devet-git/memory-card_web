// Picks believable wrong answers for multiple choice: same part of speech, similar word
// popularity and similar length as the right answer, instead of a random card from the deck.

export interface WordProfile {
  pos: string; // letters from "nvar"; "" when unknown
  rank: number; // 0 when unknown
}

export interface Candidate {
  text: string;
  profile?: WordProfile;
}

const sharesPos = (a: string, b: string) => a.split("").some((p) => b.includes(p));

/** Lower = more similar. Unknown data counts as neutral so non-English decks behave like before. */
export function distance(correct: Candidate, other: Candidate, jitter: number): number {
  let d = 0;
  const a = correct.profile;
  const b = other.profile;
  if (a?.pos && b?.pos) d += sharesPos(a.pos, b.pos) ? 0 : 1;
  else d += 0.5;
  if (a?.rank && b?.rank) d += Math.min(1.5, Math.abs(Math.log10(a.rank) - Math.log10(b.rank)));
  else d += 0.75;
  const la = correct.text.length;
  const lb = other.text.length;
  d += (Math.abs(la - lb) / Math.max(la, lb, 1)) * 1.2;
  return d + jitter;
}

/** Best `count` distinct candidates for a question; `random` makes results vary between sessions. */
export function pickDistractors(correct: Candidate, candidates: Candidate[], count = 3, random: () => number = Math.random): string[] {
  const seen = new Set([correct.text.trim().toLowerCase()]);
  const unique = candidates.filter((c) => {
    const key = c.text.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique
    .map((c) => ({ c, d: distance(correct, c, random() * 0.8) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, count)
    .map((x) => x.c.text);
}
