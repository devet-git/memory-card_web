import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import useCollectionContext from "contexts/Collection";
import FlipCard from "components/FlipCard";
import MyButton from "components/MyButton";
import { PageContainer, Panel, MutedText } from "components/ui";
import { Grade, isDue, isNewCard, previewInterval, NEW_CARDS_PER_SESSION } from "utils/srs";
import { playSound } from "utils/sound";
import { dateKey } from "utils/dates";
import { WordItem } from "types";

interface QueueItem {
  pathname: string;
  wordId: string | number;
}

const Progress = styled.div`
  height: 8px;
  border-radius: 9999px;
  background: var(--bg-tertiary, #e2e8f0);
  overflow: hidden;

  > div {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.25s ease;
  }
`;

const RatingRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  @media (max-width: 520px) {
    gap: 6px;
  }
`;

const RateButton = styled.button<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1px solid ${(p) => p.$color};
  background: transparent;
  color: ${(p) => p.$color};
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;

  small {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.85;
  }

  &:hover {
    background: ${(p) => p.$color}22;
  }
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 24px 0;

  svg {
    font-size: 56px;
    color: #10b981;
  }
`;

const GRADES: { grade: Grade; label: string; color: string; key: string }[] = [
  { grade: 0, label: "Quên", color: "#ef4444", key: "1" },
  { grade: 1, label: "Khó", color: "#f59e0b", key: "2" },
  { grade: 2, label: "Tốt", color: "#3b82f6", key: "3" },
  { grade: 3, label: "Dễ", color: "#10b981", key: "4" }
];

export default function ReviewPage() {
  const { collections, reviewWord, updateWord, undoReviewCount, stats, settings } = useCollectionContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deckFilter = searchParams.get("deck");
  const deckName = deckFilter ? collections.find((c) => c.pathname === deckFilter)?.name : undefined;

  const buildQueue = useCallback((): QueueItem[] => {
    const now = Date.now();
    const due: QueueItem[] = [];
    const fresh: QueueItem[] = [];
    collections.forEach((c) => {
      if (deckFilter && c.pathname !== deckFilter) return;
      c.words.forEach((w) => {
        if (isDue(w, now)) due.push({ pathname: c.pathname, wordId: w.id });
        else if (isNewCard(w)) fresh.push({ pathname: c.pathname, wordId: w.id });
      });
    });
    return [...due, ...fresh.slice(0, NEW_CARDS_PER_SESSION)];
  }, [collections, deckFilter]);

  // The queue is frozen at session start; "Quên" cards are appended again at the end
  const [queue, setQueue] = useState<QueueItem[]>(buildQueue);
  const [position, setPosition] = useState(0);
  const [done, setDone] = useState(0);
  const [reveal, setReveal] = useState(0); // bump to remount the card
  const [flipped, setFlipped] = useState(false);
  const [history, setHistory] = useState<{ item: QueueItem; before: Partial<WordItem>; grade: Grade }[]>([]);

  const current = queue[position];
  const currentWord: WordItem | undefined = useMemo(() => {
    if (!current) return undefined;
    return collections.find((c) => c.pathname === current.pathname)?.words.find((w) => String(w.id) === String(current.wordId));
  }, [collections, current]);

  const rate = useCallback(
    (grade: Grade) => {
      if (!current) return;
      // A focused rating button would otherwise re-fire on the Space key used to flip the next card
      (document.activeElement as HTMLElement | null)?.blur?.();
      if (currentWord) {
        // Remember the scheduling fields so the answer can be undone
        const { dueDate, intervalDays, ease, lapses, wrongCount, status, reviewCount, lastReviewed } = currentWord;
        setHistory((h) => [...h, { item: current, before: { dueDate, intervalDays, ease, lapses, wrongCount, status, reviewCount, lastReviewed }, grade }]);
      }
      reviewWord(current.pathname, current.wordId, grade);
      playSound(grade >= 2 ? "correct" : "click");
      if (grade === 0) {
        setQueue((q) => [...q, current]);
      } else {
        setDone((d) => d + 1);
      }
      setPosition((p) => p + 1);
      setFlipped(false);
      setReveal((r) => r + 1);
    },
    [current, currentWord, reviewWord]
  );

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    updateWord(last.item.pathname, last.item.wordId, last.before);
    undoReviewCount();
    if (last.grade === 0) setQueue((q) => q.slice(0, -1));
    else setDone((d) => Math.max(0, d - 1));
    setPosition((p) => Math.max(0, p - 1));
    setHistory((h) => h.slice(0, -1));
    setFlipped(false);
    setReveal((r) => r + 1);
  }, [history, updateWord, undoReviewCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if ((e.key === "z" || e.key === "Z" || e.key === "Backspace") && history.length > 0) {
        e.preventDefault();
        undo();
        return;
      }
      const item = GRADES.find((g) => g.key === e.key);
      if (item) {
        e.preventDefault();
        rate(item.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rate, undo, history.length]);

  const restart = () => {
    setQueue(buildQueue());
    setPosition(0);
    setDone(0);
    setHistory([]);
    setFlipped(false);
    setReveal((r) => r + 1);
  };

  const total = queue.length;
  const goal = settings.dailyGoal || 20;
  const today = stats.reviewLog?.[dateKey()] || 0;

  return (
    <PageContainer>
      <Panel>
        <h2>Ôn tập hôm nay{deckName ? ` — ${deckName}` : ""}</h2>
        <MutedText>
          Thẻ đến hạn và thẻ mới được xếp lịch theo thuật toán lặp lại ngắt quãng. Hôm nay bạn đã ôn {today}/{goal} thẻ.
        </MutedText>
      </Panel>

      {!currentWord || position >= queue.length ? (
        <Panel>
          <Center>
            <IoCheckmarkCircleOutline />
            <h3 style={{ margin: 0 }}>{total === 0 ? "Hôm nay không có thẻ nào cần ôn!" : `Hoàn thành ${done} thẻ!`}</h3>
            <MutedText>Quay lại sau để ôn các thẻ đến hạn tiếp theo, hoặc thêm từ mới vào bộ sưu tập.</MutedText>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <MyButton variant="primary" onClick={() => navigate("/collections")}>
                Xem bộ sưu tập
              </MyButton>
              <MyButton variant="secondary" onClick={restart}>
                Kiểm tra lại thẻ đến hạn
              </MyButton>
            </div>
          </Center>
        </Panel>
      ) : (
        <>
          <Progress aria-label="Tiến độ">
            <div style={{ width: `${Math.min(100, (position / total) * 100)}%` }} />
          </Progress>
          <MutedText>
            Thẻ {Math.min(position + 1, total)}/{total} • Đã xong {done}
          </MutedText>

          <FlipCard
            key={`${currentWord.id}-${reveal}`}
            front={currentWord.source}
            back={currentWord.target}
            phonetic={currentWord.phonetic}
            example={currentWord.example}
            image={currentWord.image}
            mnemonic={currentWord.mnemonic}
            flipped={flipped}
            onFlipChange={setFlipped}
            autoSpeak={settings.autoSpeak}
            status={currentWord.status}
            height="clamp(300px, 42vh, 380px)"
          />

          <MutedText>Space/Enter: lật thẻ • 1-4: chấm điểm • Z: hoàn tác</MutedText>
          <RatingRow>
            {GRADES.map((g) => (
              <RateButton key={g.grade} $color={g.color} onClick={() => rate(g.grade)} title={`Phím ${g.key}`}>
                {g.label}
                <small>{previewInterval(currentWord, g.grade)}</small>
              </RateButton>
            ))}
          </RatingRow>
          {history.length > 0 && (
            <div>
              <MyButton variant="ghost" size="sm" onClick={undo} title="Phím Z">
                ↶ Hoàn tác câu vừa chấm
              </MyButton>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
