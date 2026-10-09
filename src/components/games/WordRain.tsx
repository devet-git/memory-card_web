import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { playSound } from "utils/sound";
import { firstMeaning, isNewBest } from "utils/games";
import { Drop, RAIN_LIVES, RainState, newRain, stepRain, matchDrop, levelOf, rainPoints, rainCoins } from "utils/wordRain";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";

const Field = styled.div<{ $hit: boolean }>`
  position: relative;
  height: clamp(300px, 52vh, 460px);
  overflow: hidden;
  border-radius: 14px;
  border: 2px solid ${(p) => (p.$hit ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.14), rgba(59, 130, 246, 0.02));
  transition: border-color 0.15s ease;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 8px;
    background: repeating-linear-gradient(45deg, #ef4444 0 8px, transparent 8px 16px);
    opacity: 0.55;
  }
`;

const Bubble = styled.div<{ $x: number; $y: number; $danger: boolean }>`
  position: absolute;
  left: ${(p) => p.$x}%;
  top: ${(p) => p.$y * 100}%;
  max-width: 54%;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  background: ${(p) => (p.$danger ? "#ef4444" : "#3b82f6")};
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  will-change: top;
  pointer-events: none;
`;

interface Props {
  words: WordItem[];
  onAnswer: (wordId: string | number, correct: boolean) => void;
  onExit: () => void;
}

/** Meanings fall from the sky: type the English word before it hits the ground. */
export default function WordRain({ words, onAnswer, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(RAIN_LIVES);
  const [combo, setCombo] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [missedWords, setMissedWords] = useState<WordItem[]>([]);
  const [typed, setTyped] = useState("");
  const [hit, setHit] = useState(false);
  const [summary, setSummary] = useState<{ coins: number; newBest: boolean } | null>(null);

  const sim = useRef<RainState>(newRain());
  const poolRef = useRef(words);
  const live = useRef({ score: 0, lives: RAIN_LIVES, combo: 0 });
  const missed = useRef(new Set<string>());
  const hitTimer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const reported = useRef(false);

  const start = () => {
    poolRef.current = words;
    sim.current = newRain();
    live.current = { score: 0, lives: RAIN_LIVES, combo: 0 };
    missed.current = new Set();
    reported.current = false;
    setDrops([]);
    setScore(0);
    setLives(RAIN_LIVES);
    setCombo(0);
    setCleared(0);
    setBestCombo(0);
    setMissedWords([]);
    setTyped("");
    setSummary(null);
    setPhase("playing");
  };

  // Simulation loop
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // a background tab must not drop everything at once
      last = now;
      const { state, lost } = stepRain(sim.current, dt, poolRef.current);
      sim.current = state;
      setDrops(state.drops);
      if (lost.length > 0) {
        live.current.combo = 0;
        live.current.lives = Math.max(0, live.current.lives - lost.length);
        setCombo(0);
        setLives(live.current.lives);
        setHit(true);
        window.clearTimeout(hitTimer.current);
        hitTimer.current = window.setTimeout(() => setHit(false), 250);
        playSound("wrong");
        const fresh = lost.map((d) => d.word).filter((w) => !missed.current.has(String(w.id)));
        fresh.forEach((w) => {
          missed.current.add(String(w.id));
          onAnswer(w.id, false); // a word that hit the ground goes into the review schedule
        });
        if (fresh.length) setMissedWords((m) => [...m, ...fresh]);
        if (live.current.lives <= 0) return setPhase("over");
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => window.clearTimeout(hitTimer.current), []);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase]);

  const destroy = useCallback((typedText: string, force: boolean) => {
    const target = matchDrop(sim.current.drops, typedText, force);
    if (!target) return false;
    sim.current = { ...sim.current, drops: sim.current.drops.filter((d) => d.uid !== target.uid), cleared: sim.current.cleared + 1 };
    const points = rainPoints(target.word, live.current.combo);
    live.current.score += points;
    live.current.combo += 1;
    setScore(live.current.score);
    setCombo(live.current.combo);
    setBestCombo((b) => Math.max(b, live.current.combo));
    setCleared(sim.current.cleared);
    setDrops(sim.current.drops);
    setTyped("");
    playSound("correct");
    return true;
  }, []);

  const onChange = (value: string) => {
    setTyped(value);
    destroy(value, false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) return;
    if (!destroy(typed, true)) {
      // a wrong word breaks the combo
      live.current.combo = 0;
      setCombo(0);
      setTyped("");
      playSound("click");
    }
  };

  // Save the result once
  useEffect(() => {
    if (phase !== "over" || reported.current) return;
    reported.current = true;
    const finalScore = live.current.score;
    const coins = rainCoins(finalScore);
    setSummary({ coins, newBest: isNewBest(stats, "rain", finalScore) });
    recordGame({ game: "rain", score: finalScore, coins });
    playSound("complete");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const level = levelOf(cleared);

  if (phase === "ready") {
    return (
      <GameBox>
        <GameHeader title="Mưa chữ" onExit={onExit} />
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Nghĩa tiếng Việt rơi từ trên xuống. Gõ <b>từ tiếng Anh</b> tương ứng để phá nó trước khi chạm đất. Bạn có {RAIN_LIVES} ❤️, mỗi từ rơi xuống đất mất một tim.
          Phá liên tiếp 5 từ thì điểm nhân đôi (tối đa ×4), càng lâu mưa càng nhanh.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Từ khớp sẽ tự nổ ngay khi gõ đủ chữ (nhấn Enter nếu có từ dài hơn bắt đầu giống nhau). Từ rơi xuống đất sẽ được ghi nhận để ôn lại; phá đúng không đổi lịch ôn.
        </p>
        <MyButton variant="primary" size="lg" onClick={start}>
          Bắt đầu
        </MyButton>
      </GameBox>
    );
  }

  if (phase === "over") {
    return (
      <GameBox>
        <GameHeader title="Mưa chữ" onExit={onExit} />
        <GameResultCard
          emoji={score >= 300 ? "🏆" : "🌧️"}
          title={`Kết thúc! ${score} điểm`}
          lines={[["Từ đã phá", cleared], ["Cấp độ", level], ["Combo dài nhất", bestCombo]]}
          coins={summary?.coins ?? 0}
          newBest={summary?.newBest}
          onReplay={start}
          onExit={onExit}
        >
          {missedWords.length > 0 && (
            <div style={{ width: "100%", textAlign: "left", fontSize: 14 }}>
              <b>Cần ôn lại:</b>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {missedWords.map((w) => (
                  <li key={String(w.id)}>
                    <b>{w.source}</b> — {firstMeaning(w.target)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GameResultCard>
      </GameBox>
    );
  }

  return (
    <GameBox style={{ maxWidth: 640 }}>
      <GameHeader
        title="Mưa chữ"
        onExit={onExit}
        meta={
          <>
            <span>⭐ {score}</span>
            <span>Cấp {level}</span>
            <span>🔥 ×{Math.min(4, 1 + Math.floor(combo / 5))}</span>
            <span aria-label={`${lives} tim`}>
              {"❤️".repeat(lives)}
              {"🖤".repeat(RAIN_LIVES - lives)}
            </span>
          </>
        }
      />
      <Field $hit={hit} aria-label="Khu vực mưa chữ" onClick={() => inputRef.current?.focus()}>
        {drops.map((d) => (
          <Bubble key={d.uid} $x={d.x} $y={d.y * 0.88} $danger={d.y > 0.7}>
            {firstMeaning(d.word.target)}
          </Bubble>
        ))}
      </Field>
      <form onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Gõ từ tiếng Anh..."
          aria-label="Gõ từ tiếng Anh"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          style={{ width: "100%", padding: "12px 14px", fontSize: 18, borderRadius: 10, border: "2px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit", textAlign: "center", boxSizing: "border-box" }}
        />
      </form>
    </GameBox>
  );
}
