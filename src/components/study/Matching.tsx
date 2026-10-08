import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { playSound } from "utils/sound";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, shuffled, useStableWords } from "./shared";

const PAIRS_PER_ROUND = 6;

const Board = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
`;

const TileButton = styled.button<{ $selected: boolean; $wrong: boolean; $done: boolean }>`
  padding: 14px 10px;
  min-height: 56px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid
    ${(p) => (p.$done ? "#10b981" : p.$wrong ? "#ef4444" : p.$selected ? "#3b82f6" : "var(--border-color, #cbd5e1)")};
  background: ${(p) =>
    p.$done ? "rgba(16, 185, 129, 0.12)" : p.$wrong ? "rgba(239, 68, 68, 0.12)" : "var(--bg-card, #ffffff)"};
  color: var(--text-primary, #0f172a);
  opacity: ${(p) => (p.$done ? 0.5 : 1)};
  pointer-events: ${(p) => (p.$done ? "none" : "auto")};
  transition: all 0.15s ease;
`;

interface Tile {
  key: string;
  wordId: string | number;
  text: string;
  side: "source" | "target";
}

/** Match each term with its meaning; a timer and mistake counter make it a quick game. */
export default function Matching({ words: liveWords, onAnswer }: StudyModeProps) {
  const words = useStableWords(liveWords);
  const [round, setRound] = useState(0);
  const roundWords = useMemo(
    () => shuffled(words).slice(0, PAIRS_PER_ROUND),
    [words, round] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sources = useMemo(
    () => shuffled<Tile>(roundWords.map((w) => ({ key: `s-${w.id}`, wordId: w.id, text: w.source, side: "source" as const }))),
    [roundWords]
  );
  const targets = useMemo(
    () => shuffled<Tile>(roundWords.map((w) => ({ key: `t-${w.id}`, wordId: w.id, text: w.target, side: "target" as const }))),
    [roundWords]
  );

  const [selected, setSelected] = useState<Tile | null>(null);
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string | number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const missedIds = useRef<Set<string | number>>(new Set());

  const finished = roundWords.length > 0 && doneIds.size === roundWords.length;

  useEffect(() => {
    if (finished || roundWords.length === 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished, roundWords.length, round]);

  const pick = (tile: Tile) => {
    if (wrongKeys.length > 0) return;
    if (!selected || selected.side === tile.side) {
      setSelected(tile);
      return;
    }
    if (selected.wordId === tile.wordId) {
      playSound("correct");
      onAnswer(tile.wordId, !missedIds.current.has(tile.wordId));
      setDoneIds((prev) => new Set(prev).add(tile.wordId));
      setSelected(null);
    } else {
      playSound("wrong");
      missedIds.current.add(selected.wordId);
      missedIds.current.add(tile.wordId);
      setMistakes((m) => m + 1);
      setWrongKeys([selected.key, tile.key]);
      setSelected(null);
      setTimeout(() => setWrongKeys([]), 600);
    }
  };

  const next = () => {
    setRound((r) => r + 1);
    setDoneIds(new Set());
    setSelected(null);
    setMistakes(0);
    setSeconds(0);
    missedIds.current = new Set();
  };

  if (words.length < 2) return <ModeCard>Cần ít nhất 2 thẻ để chơi ghép cặp.</ModeCard>;

  return (
    <ModeWrap>
      <ModeMeta>
        <span>
          Đã ghép {doneIds.size}/{roundWords.length}
        </span>
        <span>
          Sai: {mistakes} • {seconds}s
        </span>
      </ModeMeta>
      {finished ? (
        <ModeCard>
          <h3 style={{ margin: 0 }}>
            Xong trong {seconds}s với {mistakes} lần ghép sai!
          </h3>
          <MyButton variant="primary" onClick={next}>
            Chơi vòng mới
          </MyButton>
        </ModeCard>
      ) : (
        <Board>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sources.map((t) => (
              <TileButton key={t.key} $selected={selected?.key === t.key} $wrong={wrongKeys.includes(t.key)} $done={doneIds.has(t.wordId)} onClick={() => pick(t)}>
                {t.text}
              </TileButton>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {targets.map((t) => (
              <TileButton key={t.key} $selected={selected?.key === t.key} $wrong={wrongKeys.includes(t.key)} $done={doneIds.has(t.wordId)} onClick={() => pick(t)}>
                {t.text}
              </TileButton>
            ))}
          </div>
        </Board>
      )}
    </ModeWrap>
  );
}
