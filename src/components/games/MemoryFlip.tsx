import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { playSound } from "utils/sound";
import { MEMORY_LEVELS, MEMORY_MIN_PAIRS, MemoryCard, buildMemoryCards, memoryScore, memoryStars, memoryCoins, isNewBest, profileOf } from "utils/games";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";

const Grid = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, 1fr);
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: repeat(${(p) => Math.min(p.$cols, 4)}, 1fr);
  }
`;

const Tile = styled.button<{ $open: boolean; $matched: boolean; $side: "term" | "meaning" }>`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  border: 2px solid ${(p) => (p.$matched ? "#10b981" : p.$open ? "#3b82f6" : "var(--border-color, #cbd5e1)")};
  background: ${(p) =>
    p.$matched ? "rgba(16,185,129,0.15)" : p.$open ? (p.$side === "term" ? "rgba(59,130,246,0.14)" : "rgba(139,92,246,0.14)") : "var(--bg-tertiary, #e2e8f0)"};
  color: inherit;
  font: inherit;
  cursor: ${(p) => (p.$open || p.$matched ? "default" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  text-align: center;
  overflow: hidden;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.97);
  }
  .face {
    font-size: clamp(11px, 2.9vw, 15px);
    font-weight: 700;
    line-height: 1.2;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .back {
    font-size: 22px;
    opacity: 0.45;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

interface Props {
  words: WordItem[];
  onExit: () => void;
}

const MISMATCH_MS = 900;

/** Flip two cards at a time to find each term with its meaning. */
export default function MemoryFlip({ words, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const [pairs, setPairs] = useState<number | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [summary, setSummary] = useState<{ score: number; coins: number; newBest: boolean } | null>(null);
  const lock = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const available = useMemo(() => buildMemoryCards(words, 99).length / 2, [words]);
  // The easiest level adapts to small decks; harder ones need a full set of pairs
  const levels = MEMORY_LEVELS.filter((l, i) => (i === 0 ? available >= MEMORY_MIN_PAIRS : available >= l.pairs));

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const begin = (level: number) => {
    const board = buildMemoryCards(words, level);
    window.clearTimeout(timer.current);
    lock.current = false;
    setPairs(board.length / 2);
    setCards(board);
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setSummary(null);
  };

  const total = cards.length / 2;
  const done = total > 0 && matched.size === total;

  // Stopwatch from the first flip until the board is cleared
  useEffect(() => {
    if (!started || done) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, done]);

  const reported = useRef(false);
  useEffect(() => {
    if (!done) {
      reported.current = false;
      return;
    }
    if (reported.current) return;
    reported.current = true;
    const score = memoryScore(total, moves, seconds);
    const coins = memoryCoins(total, moves);
    setSummary({ score, coins, newBest: isNewBest(stats, `memory-${total}`, score) });
    recordGame({ game: `memory-${total}`, score, coins });
    playSound("complete");
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = useCallback(
    (index: number) => {
      if (lock.current || done || open.includes(index) || matched.has(cards[index].pairId)) return;
      setStarted(true);
      playSound("flip");
      const next = [...open, index];
      setOpen(next);
      if (next.length < 2) return;
      setMoves((m) => m + 1);
      const [a, b] = next.map((i) => cards[i]);
      if (a.pairId === b.pairId && a.side !== b.side) {
        setMatched((m) => new Set(m).add(a.pairId));
        setOpen([]);
        playSound("correct");
      } else {
        lock.current = true;
        timer.current = window.setTimeout(() => {
          setOpen([]);
          lock.current = false;
        }, MISMATCH_MS);
      }
    },
    [cards, open, matched, done]
  );

  if (pairs === null) {
    return (
      <GameBox>
        <GameHeader title="Lật thẻ trí nhớ" onExit={onExit} />
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Lật hai thẻ mỗi lượt để ghép <b>từ</b> với <b>nghĩa</b> của nó. Nhớ vị trí các thẻ để ghép trong ít lượt nhất.
        </p>
        {levels.length === 0 ? (
          <p style={{ margin: 0, color: "#b45309" }}>Cần ít nhất {MEMORY_MIN_PAIRS} thẻ có từ và nghĩa ngắn để chơi.</p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {levels.map((l) => {
              const n = Math.min(l.pairs, available);
              const best = profileOf(stats).best[`memory-${n}`];
              return (
                <MyButton key={l.label} variant="secondary" onClick={() => begin(l.pairs)}>
                  {l.label} • {n} cặp{best ? ` • kỷ lục ${best}` : ""}
                </MyButton>
              );
            })}
          </div>
        )}
      </GameBox>
    );
  }

  const cols = MEMORY_LEVELS.find((l) => l.pairs >= pairs)?.cols ?? 4;
  const stars = memoryStars(total, moves);

  return (
    <GameBox style={{ maxWidth: 640 }}>
      <GameHeader
        title="Lật thẻ trí nhớ"
        onExit={onExit}
        meta={
          <>
            <span>🔁 {moves}</span>
            <span>⏱ {seconds}s</span>
          </>
        }
      />
      <Grid $cols={cols}>
        {cards.map((card, i) => {
          const isMatched = matched.has(card.pairId);
          const isOpen = open.includes(i) || isMatched;
          return (
            <Tile
              key={card.key}
              $open={isOpen}
              $matched={isMatched}
              $side={card.side}
              onClick={() => flip(i)}
              aria-label={isOpen ? card.text : "Thẻ úp"}
              aria-pressed={isOpen}
            >
              {isOpen ? <span className="face">{card.text}</span> : <span className="back">?</span>}
            </Tile>
          );
        })}
      </Grid>
      {done && summary && (
        <GameResultCard
          emoji={stars === 3 ? "🌟" : stars === 2 ? "✨" : "👍"}
          title={`Hoàn thành! ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`}
          lines={[["Điểm", summary.score], ["Số lượt lật", moves], ["Thời gian", `${seconds}s`]]}
          coins={summary.coins}
          newBest={summary.newBest}
          onReplay={() => begin(pairs)}
          onExit={onExit}
        >
          <MyButton variant="ghost" size="sm" onClick={() => setPairs(null)}>
            Đổi cấp độ
          </MyButton>
        </GameResultCard>
      )}
    </GameBox>
  );
}
