import { useEffect, useRef, useState } from "react";
import { WordItem } from "types";
import { lookupLocal, prefetch } from "utils/localDict";
import { WordProfile } from "utils/distractors";

/**
 * Part of speech and popularity of each card's front (from the offline dictionary).
 * `ready` flips to true once, after the first load, so consumers regenerate at most once.
 * The map lives in a ref and keeps filling in silently afterwards.
 */
export default function useWordProfiles(words: WordItem[]) {
  const profiles = useRef<Map<string, WordProfile>>(new Map());
  const [ready, setReady] = useState(false);
  const signature = words.map((w) => `${w.id}|${w.source}`).join("\n");

  useEffect(() => {
    let cancelled = false;
    const single = words.filter((w) => /^[A-Za-z]{2,}$/.test(w.source.trim()));
    prefetch(single.map((w) => w.source))
      .then(() =>
        Promise.all(
          single.map(async (w) => {
            const entry = await lookupLocal(w.source);
            if (entry) profiles.current.set(String(w.id), { pos: entry.pos, rank: entry.rank });
          })
        )
      )
      .catch(() => {})
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { profiles, ready };
}
