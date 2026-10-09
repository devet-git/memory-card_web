import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { playSound } from "utils/sound";
import {
  TF_SECONDS,
  TF_WRONG_PENALTY_MS,
  TfQuestion,
  makeTfQuestion,
  tfPoints,
  tfMultiplier,
  tfCoins,
  shuffle,
  isNewBest,
  firstMeaning
} from "utils/games";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";

const Prompt = styled.div<{ $flash: "ok" | "bad" | null }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid ${(p) => (p.$flash === "ok" ? "#10b981" : p.$flash === "bad" ? "#ef4444" : "var(--border-color, #e2e8f0)")};
  background: ${(p) => (p.$flash === "ok" ? "rgba(16,185,129,0.12)" : p.$flash === "bad" ? "rgba(239,68,68,0.12)" : "var(--bg-card, transparent)")};
  transition: background 0.15s ease, border-color 0.15s ease;

  .term {
    font-size: clamp(26px, 7vw, 36px);
    font-weight: 800;
  }
  .eq {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
  .meaning {
    font-size: clamp(18px, 5vw, 22px);
    font-weight: 700;
    color: #2563eb;
  }
`;

const Bar = styled.div<{ $pct: number; $low: boolean }>`
  height: 8px;
  border-radius: 9999px;
  background: var(--bg-tertiary, #e2e8f0);
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(p) => p.$pct}%;
    background: ${(p) => (p.$low ? "#ef4444" : "#3b82f6")};
  }
`;

const Answers = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  button {
    padding: 16px 0;
    font-size: 18px;
  }
`;

interface Props {
  words: WordItem[];
  onAnswer: (wordId: string | number, correct: boolean) => void;
  onExit: () => void;
}

/** 60 seconds: is this meaning right for the term? Combos multiply points; wrong answers cost time. */
export default function TrueFalse({ words, onAnswer, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const poolRef = useRef(words);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [question, setQuestion] = useState<TfQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(TF_SECONDS * 1000);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState<WordItem[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [summary, setSummary] = useState<{ coins: number; newBest: boolean } | null>(null);

  const endAt = useRef(0);
  const queue = useRef<WordItem[]>([]);
  const cursor = useRef(0);
  const seenWrong = useRef(new Set<string>());
  const flashTimer = useRef<number | undefined>(undefined);

  const nextQuestion = useCallback(() => {
    if (cursor.current >= queue.current.length) {
      queue.current = shuffle(poolRef.current);
      cursor.current = 0;
    }
    const word = queue.current[cursor.current++];
    setQuestion(makeTfQuestion(word, poolRef.current));
  }, []);

  const start = () => {
    poolRef.current = words;
    queue.current = shuffle(words);
    cursor.current = 0;
    seenWrong.current = new Set();
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRight(0);
    setWrong([]);
    setSummary(null);
    setFlash(null);
    endAt.current = Date.now() + TF_SECONDS * 1000;
    setTimeLeft(TF_SECONDS * 1000);
    nextQuestion();
    setPhase("playing");
  };

  // Countdown
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const left = endAt.current - Date.now();
      if (left <= 0) {
        setTimeLeft(0);
        setPhase("over");
      } else setTimeLeft(left);
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const answer = useCallback(
    (saysTrue: boolean) => {
      if (phase !== "playing" || !question) return;
      const correct = saysTrue === question.truth;
      if (correct) {
        setScore((s) => s + tfPoints(streak));
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setRight((r) => r + 1);
        playSound("correct");
      } else {
        setStreak(0);
        endAt.current -= TF_WRONG_PENALTY_MS;
        const key = String(question.word.id);
        if (!seenWrong.current.has(key)) {
          seenWrong.current.add(key);
          setWrong((w) => [...w, question.word]);
          onAnswer(question.word.id, false); // only a miss touches the review schedule
        }
        playSound("wrong");
      }
      setFlash(correct ? "ok" : "bad");
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 220);
      nextQuestion();
    },
    [phase, question, streak, nextQuestion, onAnswer]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") answer(true);
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "f") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  // Save the result once
  const reported = useRef(false);
  useEffect(() => {
    if (phase === "playing") reported.current = false;
    if (phase !== "over" || reported.current) return;
    reported.current = true;
    const coins = tfCoins(score);
    setSummary({ coins, newBest: isNewBest(stats, "tf", score) });
    recordGame({ game: "tf", score, coins });
    playSound("complete");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = right + wrong.length;

  if (phase === "ready") {
    return (
      <GameBox>
        <GameHeader title="Đúng hay sai?" onExit={onExit} />
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Bạn có <b>{TF_SECONDS} giây</b>. Mỗi câu hiện một từ và một nghĩa, hãy chọn nghĩa đó <b>đúng</b> hay <b>sai</b> càng nhanh càng tốt.
          Đúng liên tiếp 5 lần thì điểm nhân đôi (tối đa ×4). Trả lời sai bị trừ {TF_WRONG_PENALTY_MS / 1000} giây và mất combo.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Bàn phím: <b>→</b> hoặc <b>J</b> = Đúng, <b>←</b> hoặc <b>F</b> = Sai. Từ trả lời sai sẽ được ghi nhận để ôn lại; trả lời đúng không đổi lịch ôn.
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
        <GameHeader title="Đúng hay sai?" onExit={onExit} />
        <GameResultCard
          emoji={score >= 200 ? "🏆" : "⏱️"}
          title={`Hết giờ! ${score} điểm`}
          lines={[
            ["Đúng", right],
            ["Sai", wrong.length],
            ["Chính xác", total ? `${Math.round((right / total) * 100)}%` : "–"],
            ["Combo dài nhất", bestStreak]
          ]}
          coins={summary?.coins ?? 0}
          newBest={summary?.newBest}
          onReplay={start}
          onExit={onExit}
        >
          {wrong.length > 0 && (
            <div style={{ width: "100%", textAlign: "left", fontSize: 14 }}>
              <b>Cần ôn lại:</b>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {wrong.map((w) => (
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
    <GameBox>
      <GameHeader
        title="Đúng hay sai?"
        onExit={onExit}
        meta={
          <>
            <span>⭐ {score}</span>
            <span>🔥 ×{tfMultiplier(streak)}</span>
          </>
        }
      />
      <Bar $pct={(timeLeft / (TF_SECONDS * 1000)) * 100} $low={timeLeft < 10000} role="progressbar" aria-valuenow={Math.ceil(timeLeft / 1000)} aria-valuemin={0} aria-valuemax={TF_SECONDS} aria-label="Thời gian còn lại" />
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700 }}>{Math.ceil(timeLeft / 1000)}s</div>
      {question && (
        <Prompt $flash={flash} aria-live="polite">
          <div className="term">{question.word.source}</div>
          <div className="eq">có nghĩa là</div>
          <div className="meaning">{question.shown}</div>
        </Prompt>
      )}
      <Answers>
        <MyButton variant="danger" onClick={() => answer(false)}>
          ✗ Sai
        </MyButton>
        <MyButton variant="success" onClick={() => answer(true)}>
          ✓ Đúng
        </MyButton>
      </Answers>
    </GameBox>
  );
}
