import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { playSound } from "utils/sound";
import { isNewBest, firstMeaning } from "utils/games";
import { BattleQuestion, isCorrect } from "utils/boss";
import { TOWER_LIVES, sortByHardness, pickFloorWord, floorQuestion, floorPoints, towerCoins, floorKind } from "utils/tower";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";
import QuestionPanel, { Reveal } from "./QuestionPanel";

const Tower = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 8px 0;

  .floor {
    width: 100%;
    max-width: 260px;
    text-align: center;
    padding: 4px 0;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: var(--bg-tertiary, #e2e8f0);
    color: var(--text-secondary, #64748b);
  }
  .floor.now {
    background: #7c3aed;
    color: #fff;
    transform: scale(1.04);
  }
  .floor.done {
    background: rgba(16, 185, 129, 0.2);
    color: #059669;
  }
`;

interface Props {
  words: WordItem[];
  onAnswer: (wordId: string | number, correct: boolean) => void;
  onExit: () => void;
}

/** Climb as high as you can: harder cards and trickier questions every floor. */
export default function TowerClimb({ words, onAnswer, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const [phase, setPhase] = useState<"ready" | "climb" | "over">("ready");
  const [floor, setFloor] = useState(1);
  const [lives, setLives] = useState(TOWER_LIVES);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [missedWords, setMissedWords] = useState<WordItem[]>([]);
  const [summary, setSummary] = useState<{ coins: number; newBest: boolean } | null>(null);

  const poolRef = useRef(words);
  const sorted = useRef<WordItem[]>([]);
  const used = useRef(new Set<string>());
  const current = useRef<WordItem | null>(null);
  const missed = useRef(new Set<string>());
  const reported = useRef(false);

  const loadFloor = (n: number) => {
    const word = pickFloorWord(sorted.current, n, used.current);
    current.current = word;
    setQuestion(floorQuestion(n, word, poolRef.current));
  };

  const start = () => {
    poolRef.current = words;
    sorted.current = sortByHardness(words);
    used.current = new Set();
    missed.current = new Set();
    reported.current = false;
    setFloor(1);
    setLives(TOWER_LIVES);
    setScore(0);
    setMissedWords([]);
    setReveal(null);
    setSummary(null);
    loadFloor(1);
    setPhase("climb");
  };

  const submit = (input: string) => {
    if (!question || reveal || !current.current) return;
    const ok = isCorrect(question, input);
    setReveal({ correct: ok, picked: input });
    playSound(ok ? "correct" : "wrong");
    if (ok) {
      setScore((s) => s + floorPoints(floor));
    } else {
      setLives((l) => l - 1);
      const w = current.current;
      if (!missed.current.has(String(w.id))) {
        missed.current.add(String(w.id));
        setMissedWords((m) => [...m, w]);
        onAnswer(w.id, false); // a miss goes into the review schedule
      }
    }
  };

  const next = () => {
    if (!reveal) return;
    const dead = lives <= 0;
    setReveal(null);
    if (dead) return setPhase("over");
    const n = reveal.correct ? floor + 1 : floor; // a failed floor is retried with another card
    if (reveal.correct) setFloor(n);
    loadFloor(n);
  };

  useEffect(() => {
    if (phase !== "over" || reported.current) return;
    reported.current = true;
    const coins = towerCoins(score);
    setSummary({ coins, newBest: isNewBest(stats, "tower", score) });
    recordGame({ game: "tower", score, coins });
    playSound("complete");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // A small tower on the side: the floors around the current one
  const view = useMemo(() => Array.from({ length: 5 }, (_, i) => floor + 2 - i), [floor]);

  if (phase === "ready") {
    return (
      <GameBox>
        <GameHeader title="Leo tháp" onExit={onExit} />
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Mỗi tầng là một câu hỏi. Tầng càng cao thẻ càng khó và câu hỏi càng lắt léo: chọn nghĩa, chọn từ, rồi cứ 5 tầng lại phải <b>gõ từ</b>. Bạn có {TOWER_LIVES} ❤️. Trả lời sai mất tim và thử lại tầng đó với thẻ khác.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Thẻ khó với bạn (hay sai) sẽ xuất hiện ở các tầng cao hơn. Từ trả lời sai được ghi nhận để ôn lại; trả lời đúng không đổi lịch ôn.
        </p>
        <MyButton variant="primary" size="lg" onClick={start}>
          🗼 Bắt đầu leo
        </MyButton>
      </GameBox>
    );
  }

  if (phase === "over") {
    return (
      <GameBox>
        <GameHeader title="Leo tháp" onExit={onExit} />
        <GameResultCard
          emoji={floor >= 15 ? "🏆" : "🗼"}
          title={`Bạn dừng ở tầng ${floor}`}
          lines={[["Điểm", score], ["Tầng cao nhất", floor], ["Từ cần ôn", missedWords.length]]}
          coins={summary?.coins ?? 0}
          newBest={summary?.newBest}
          onReplay={start}
          replayLabel="Leo lại"
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

  if (!question) return null;
  const kindLabel = { meaning: "chọn nghĩa", term: "chọn từ", typing: "gõ từ" }[floorKind(floor)];

  return (
    <GameBox>
      <GameHeader
        title="Leo tháp"
        onExit={onExit}
        meta={
          <>
            <span>⭐ {score}</span>
            <span aria-label={`${Math.max(0, lives)} tim`}>
              {"❤️".repeat(Math.max(0, lives))}
              {"🖤".repeat(TOWER_LIVES - Math.max(0, lives))}
            </span>
          </>
        }
      />
      <Tower aria-label={`Tầng ${floor}`}>
        {view
          .filter((n) => n >= 1)
          .map((n) => (
            <div key={n} className={`floor ${n === floor ? "now" : n < floor ? "done" : ""}`}>
              Tầng {n}
              {n === floor ? ` • ${kindLabel}` : n < floor ? " ✓" : ""}
            </div>
          ))}
      </Tower>
      <QuestionPanel
        question={question}
        reveal={reveal}
        onSubmit={submit}
        onNext={next}
        nextLabel={reveal && lives <= 0 ? "Xem kết quả" : reveal?.correct ? "Lên tầng tiếp" : "Thử lại tầng này"}
        successText={`✓ Chính xác! +${floorPoints(floor)} điểm`}
      />
    </GameBox>
  );
}
