import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { DictEntry, formatPos, lookupBest, rankTier, suggestSpelling, suggestWords } from "utils/localDict";

const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card, #ffffff);

  .label {
    padding: 4px 10px;
    font-size: 11.5px;
    color: var(--text-muted, #94a3b8);
    background: var(--bg-tertiary, #f1f5f9);
  }
`;

const Item = styled.button`
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;

  &:hover,
  &:focus {
    background: rgba(59, 130, 246, 0.1);
    outline: none;
  }

  .top {
    display: flex;
    gap: 8px;
    align-items: baseline;
    flex-wrap: wrap;
    font-size: 14px;
  }
  .ipa {
    color: #3b82f6;
    font-family: monospace;
    font-size: 12.5px;
  }
  .tier {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
  }
  .def {
    font-size: 12.5px;
    color: var(--text-secondary, #64748b);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export interface PickedWord {
  word: string;
  ipa: string;
  definition: string;
  vi: string; // Vietnamese meanings ("" if unknown)
  example: string;
}

interface Props {
  text: string;
  onPick: (picked: PickedWord) => void;
}

/** Offline word suggestions while typing: completions, or "did you mean" for misspellings. */
export default function WordSuggest({ text, onPick }: Props) {
  const [items, setItems] = useState<DictEntry[]>([]);
  const [spelling, setSpelling] = useState(false);

  useEffect(() => {
    const q = text.trim().toLowerCase();
    if (!/^[a-z]{2,}$/.test(q)) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const completions = await suggestWords(q, 6);
      // Already typed a complete word and nothing else matches: stay quiet
      const exactOnly = completions.length === 1 && completions[0].word === q;
      if (cancelled) return;
      if (completions.length > 0) {
        setItems(exactOnly ? [] : completions);
        setSpelling(false);
        return;
      }
      const near = await suggestSpelling(q, 4);
      if (cancelled) return;
      setItems(near);
      setSpelling(near.length > 0);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  if (items.length === 0) return null;

  const pick = async (entry: DictEntry) => {
    const best = await lookupBest(entry.word);
    onPick({
      word: entry.word,
      ipa: best?.ipa ? `/${best.ipa}/` : "",
      definition: best?.def ? `${best.pos ? `(${formatPos(best.pos)}) ` : ""}${best.def}` : "",
      vi: best?.vi || "",
      example: best?.example || ""
    });
    setItems([]);
  };

  return (
    <Box>
      <div className="label">{spelling ? "Có phải bạn muốn gõ:" : "Gợi ý từ (từ điển offline):"}</div>
      {items.map((e) => (
        <Item key={e.word} type="button" onClick={() => pick(e)}>
          <span className="top">
            <strong>{e.word}</strong>
            {e.ipa && <span className="ipa">/{e.ipa}/</span>}
            {e.pos && <span style={{ fontSize: 12 }}>{formatPos(e.pos)}</span>}
            <span className="tier">{rankTier(e.rank)}</span>
          </span>
          {(e.vi || e.def) && (
            <span className="def">
              {e.vi && <strong style={{ color: "var(--text-primary)" }}>{e.vi}</strong>}
              {e.vi && e.def ? " — " : ""}
              {e.def}
            </span>
          )}
        </Item>
      ))}
    </Box>
  );
}
