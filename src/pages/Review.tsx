import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import useCollectionContext from "contexts/Collection";
import FlipCard from "components/FlipCard";
import MyButton from "components/MyButton";
import { PageContainer, Panel, MutedText } from "components/ui";
import { Grade, previewInterval } from "utils/srs";
import { buildDailyPlan, isLeech, PlanItem } from "utils/plan";
import AIEnrichButton from "components/ai/AIEnrichButton";
import { MyInput } from "components/MyInput";
import SearchSelect from "components/SearchSelect";
import { playSound } from "utils/sound";
import { dateKey } from "utils/dates";
import { WordItem } from "types";

type QueueItem = PlanItem;

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
  const [searchParams, setSearchParams] = useSearchParams();
  // ?deck=a,b limits the session to those collections
  const deckFilter = searchParams.get("deck");
  const selectedDecks = deckFilter ? deckFilter.split(",").filter(Boolean) : [];
  const leechOnly = searchParams.get("leech") === "1";
  const deckName = selectedDecks.length > 0 ? selectedDecks.map((d) => collections.find((c) => c.pathname === d)?.name || d).join(", ") : undefined;

  const buildPlan = useCallback(
    () => buildDailyPlan(collections, { deck: selectedDecks, onlyLeeches: leechOnly, reverse: settings.reverseReview !== false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, deckFilter, leechOnly, settings.reverseReview]
  );

  // The queue is frozen at session start; "Quên" cards are appended again at the end
  const [plan, setPlan] = useState(buildPlan);
  const [queue, setQueue] = useState<QueueItem[]>(() => plan.items);
  const [mnemonicDraft, setMnemonicDraft] = useState<string | null>(null);
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
        const { dueDate, intervalDays, ease, stability, difficulty, lapses, wrongCount, status, reviewCount, lastReviewed } = currentWord;
        setHistory((h) => [...h, { item: current, before: { dueDate, intervalDays, ease, stability, difficulty, lapses, wrongCount, status, reviewCount, lastReviewed }, grade }]);
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
      setMnemonicDraft(null);
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
    const next = buildPlan();
    setPlan(next);
    setQueue(next.items);
    setPosition(0);
    setDone(0);
    setHistory([]);
    setFlipped(false);
    setReveal((r) => r + 1);
  };

  // Same page, different filter (?deck= / ?leech=): rebuild the session instead of keeping the old queue
  const filterKey = `${deckFilter || ""}|${leechOnly}`;
  const lastFilterKey = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKey.current === filterKey) return;
    lastFilterKey.current = filterKey;
    const next = buildPlan();
    setPlan(next);
    setQueue(next.items);
    setPosition(0);
    setDone(0);
    setHistory([]);
    setFlipped(false);
    setMnemonicDraft(null);
    setReveal((r) => r + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const total = queue.length;
  const goal = settings.dailyGoal || 20;
  const today = stats.reviewLog?.[dateKey()] || 0;

  return (
    <PageContainer>
      <Panel>
        <h2>
          {leechOnly ? "Luyện thẻ ngoan cố" : "Ôn tập hôm nay"}
          {deckName ? ` — ${deckName}` : ""}
        </h2>
        <MutedText>
          {leechOnly
            ? `${plan.items.length} thẻ bạn hay quên, xếp từ thẻ sai nhiều nhất.`
            : `Kế hoạch hôm nay: ${plan.due} thẻ đến hạn • ${plan.leeches} thẻ ngoan cố • ${plan.fresh} thẻ mới.`}{" "}
          Hôm nay bạn đã ôn {today}/{goal} thẻ.
        </MutedText>
        {collections.length > 1 && (
          <div style={{ marginTop: 10, maxWidth: 520 }}>
            <SearchSelect
              multiple
              value={selectedDecks}
              onChange={(values) => {
                const next = new URLSearchParams(searchParams);
                if (values.length > 0) next.set("deck", values.join(","));
                else next.delete("deck");
                setSearchParams(next, { replace: true });
              }}
              options={collections.map((c) => ({ value: c.pathname, label: c.name, description: `${c.words.length} thẻ` }))}
              placeholder="Tất cả bộ thẻ — chọn để giới hạn"
              searchPlaceholder="Tìm bộ thẻ..."
              ariaLabel="Chọn các bộ thẻ để ôn"
            />
          </div>
        )}
        {!leechOnly && plan.leechTotal > 0 && (
          <div style={{ marginTop: 8 }}>
            <MyButton variant="ghost" size="sm" onClick={() => navigate(`/review?leech=1${deckFilter ? `&deck=${deckFilter}` : ""}`)}>
              Luyện riêng {plan.leechTotal} thẻ ngoan cố →
            </MyButton>
          </div>
        )}
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
            {current.reversed && " • Ôn ngược: nhìn nghĩa, nhớ lại từ"}
          </MutedText>

          <FlipCard
            key={`${currentWord.id}-${reveal}`}
            front={current.reversed ? currentWord.target : currentWord.source}
            back={current.reversed ? currentWord.source : currentWord.target}
            phonetic={current.reversed ? undefined : currentWord.phonetic}
            example={currentWord.example}
            image={currentWord.image}
            mnemonic={currentWord.mnemonic}
            flipped={flipped}
            onFlipChange={setFlipped}
            autoSpeak={settings.autoSpeak && !current.reversed}
            status={currentWord.status}
            height="clamp(300px, 42vh, 380px)"
          />

          {isLeech(currentWord) && (
            <Panel style={{ borderColor: "#f59e0b", background: "rgba(245, 158, 11, 0.08)", padding: "12px 14px" }}>
              <strong style={{ fontSize: 14 }}>⚠ Thẻ ngoan cố</strong>
              <MutedText style={{ margin: "4px 0 8px" }}>
                Bạn đã quên thẻ này {currentWord.lapses || 0} lần (sai {currentWord.wrongCount || 0} lần). Ôn thêm sẽ ít hiệu quả — hãy gắn nó với một hình ảnh hay câu nói
                dễ nhớ, rồi đặt một câu với từ này.
              </MutedText>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <MyInput
                    value={mnemonicDraft ?? currentWord.mnemonic ?? ""}
                    onChange={(e) => setMnemonicDraft(e.target.value)}
                    placeholder="Mẹo nhớ của bạn (nghe giống..., hình ảnh...)"
                  />
                </div>
                <MyButton
                  variant="primary"
                  size="sm"
                  disabled={mnemonicDraft === null}
                  onClick={() => {
                    if (mnemonicDraft !== null && current) {
                      updateWord(current.pathname, current.wordId, { mnemonic: mnemonicDraft.trim() || undefined });
                      setMnemonicDraft(null);
                    }
                  }}
                >
                  Lưu mẹo
                </MyButton>
                <AIEnrichButton
                  word={currentWord.source}
                  meaning={currentWord.target}
                  onResult={(r) => r.mnemonic && setMnemonicDraft(r.mnemonic)}
                />
              </div>
            </Panel>
          )}

          <MutedText>Space/Enter: lật thẻ • 1-4: chấm điểm • Z: hoàn tác</MutedText>
          <RatingRow>
            {GRADES.map((g) => (
              <RateButton key={g.grade} $color={g.color} onClick={() => rate(g.grade)} title={`Phím ${g.key}`}>
                {g.label}
                <small>{previewInterval(currentWord, g.grade, { algorithm: settings.scheduler, retention: settings.desiredRetention })}</small>
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
