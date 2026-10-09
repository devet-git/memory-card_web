import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { playSound } from "utils/sound";
import { ChoiceEx, FillEx, OrderEx, SessionItem, grade, answerText, shuffleChoice } from "utils/grammar";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #fff);

  .topic {
    font-size: 12px;
    font-weight: 700;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .prompt {
    font-size: clamp(18px, 4.6vw, 22px);
    font-weight: 700;
    line-height: 1.5;
  }
  .blank {
    display: inline-block;
    min-width: 56px;
    border-bottom: 3px solid var(--accent-primary, #3b82f6);
    text-align: center;
    color: var(--accent-primary, #3b82f6);
  }
  .meaning {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
`;

const Bar = styled.div<{ $pct: number }>`
  height: 8px;
  border-radius: 9999px;
  background: var(--bg-tertiary, #e2e8f0);
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(p) => p.$pct}%;
    background: var(--accent-primary, #3b82f6);
    transition: width 0.25s ease;
  }
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Option = styled.button<{ $state: "idle" | "right" | "wrong" | "dim" }>`
  padding: 12px 10px;
  border-radius: 12px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  text-align: left;
  border: 2px solid ${(p) => (p.$state === "right" ? "#10b981" : p.$state === "wrong" ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background: ${(p) => (p.$state === "right" ? "rgba(16,185,129,0.15)" : p.$state === "wrong" ? "rgba(239,68,68,0.15)" : "transparent")};
  opacity: ${(p) => (p.$state === "dim" ? 0.5 : 1)};

  kbd {
    opacity: 0.55;
    margin-right: 8px;
    font-size: 12px;
  }
`;

const Tile = styled.button<{ $placed?: boolean }>`
  padding: 8px 12px;
  border-radius: 10px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  border: 2px solid ${(p) => (p.$placed ? "var(--accent-primary, #3b82f6)" : "var(--border-color, #cbd5e1)")};
  background: ${(p) => (p.$placed ? "rgba(59,130,246,0.12)" : "var(--bg-tertiary, #f1f5f9)")};
`;

const Tray = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 52px;
  padding: 8px;
  border-radius: 12px;
  border: 2px dashed var(--border-color, #cbd5e1);
  align-items: center;
`;

interface Answered {
  correct: boolean;
  response: number | string | string[];
}

// Prompt text with the blank drawn as an underline
function Prompt({ text }: { text: string }) {
  const parts = text.split("___");
  return (
    <div className="prompt">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function shuffledCopy<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  items: SessionItem[];
  mixed?: boolean; // show which topic each exercise belongs to
  onFinish: (results: { id: string; topicId: string; correct: boolean }[]) => void;
  onExit: () => void;
}

/** Runs a list of exercises one at a time with instant feedback and an explanation after each answer. */
export default function PracticeRunner({ items, mixed, onFinish, onExit }: Props) {
  // options of multiple-choice questions are shuffled once, so they don't move while the learner answers
  const prepared = useMemo(() => items.map((it) => (it.exercise.type === "choice" ? { ...it, exercise: shuffleChoice(it.exercise) } : it)), [items]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [results, setResults] = useState<{ id: string; topicId: string; correct: boolean }[]>([]);
  const [typed, setTyped] = useState("");
  const [placed, setPlaced] = useState<number[]>([]); // indices into the tile list, in the order picked
  const current = prepared[index];
  const ex = current?.exercise;

  const tiles = useMemo(() => (ex && ex.type === "order" ? shuffledCopy(ex.words.map((w, i) => ({ w, i }))) : []), [ex]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ex?.type === "fill") inputRef.current?.focus();
  }, [index, ex]);

  const submit = (response: number | string | string[]) => {
    if (!current || answered) return;
    const correct = grade(current.exercise, response);
    setAnswered({ correct, response });
    setResults((r) => [...r, { id: current.id, topicId: current.topic.id, correct }]);
    playSound(correct ? "correct" : "wrong");
  };

  const next = () => {
    if (!answered) return;
    if (index + 1 >= prepared.length) return onFinish(results);
    setIndex(index + 1);
    setAnswered(null);
    setTyped("");
    setPlaced([]);
  };

  // 1-4 pick an option, Enter moves on after an answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const onButton = Boolean((e.target as HTMLElement | null)?.closest?.("button"));
      if (answered) {
        if (e.key === "Enter" && !onButton) {
          e.preventDefault();
          next();
        }
        return;
      }
      if (ex?.type === "choice") {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < ex.options.length) submit(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!current || !ex) return null;

  const choiceState = (ex: ChoiceEx, i: number): "idle" | "right" | "wrong" | "dim" => {
    if (!answered) return "idle";
    if (i === ex.answer) return "right";
    if (i === answered.response) return "wrong";
    return "dim";
  };

  const orderSentence = (ex2: OrderEx) => placed.map((p) => ex2.words[p]).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680, width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
        <span>
          Câu {index + 1}/{prepared.length}
        </span>
        <MyButton variant="ghost" size="sm" onClick={onExit}>
          Thoát
        </MyButton>
      </div>
      <Bar $pct={((index + (answered ? 1 : 0)) / prepared.length) * 100} role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={prepared.length} aria-label="Tiến độ bài tập" />

      <Card>
        {mixed && <div className="topic">{current.topic.title}</div>}

        {ex.type === "choice" && (
          <>
            <Prompt text={ex.prompt} />
            <Options>
              {ex.options.map((o, i) => (
                <Option key={o} $state={choiceState(ex, i)} disabled={Boolean(answered)} onClick={() => submit(i)}>
                  <kbd>{i + 1}</kbd>
                  {o}
                </Option>
              ))}
            </Options>
          </>
        )}

        {ex.type === "fill" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) submit(typed);
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Prompt text={(ex as FillEx).prompt} />
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={Boolean(answered)}
              placeholder={ex.hint ? `Gõ đáp án (${ex.hint})` : "Gõ đáp án"}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Gõ đáp án"
              style={{ padding: "12px 14px", fontSize: 18, borderRadius: 10, border: `2px solid ${answered ? (answered.correct ? "#10b981" : "#ef4444") : "var(--border-color, #cbd5e1)"}`, background: "var(--bg-primary)", color: "inherit" }}
            />
            {!answered && (
              <MyButton variant="primary" type="submit" disabled={!typed.trim()}>
                Kiểm tra
              </MyButton>
            )}
          </form>
        )}

        {ex.type === "order" && (
          <>
            <div className="meaning">Sắp xếp các từ thành câu có nghĩa:</div>
            <div className="prompt">{ex.meaning}</div>
            <Tray aria-label="Câu của bạn">
              {placed.length === 0 && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Chạm vào các từ bên dưới theo thứ tự</span>}
              {placed.map((p) => (
                <Tile key={p} $placed disabled={Boolean(answered)} onClick={() => setPlaced((cur) => cur.filter((x) => x !== p))}>
                  {ex.words[p]}
                </Tile>
              ))}
            </Tray>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} aria-label="Các từ">
              {tiles.map((t) => (
                <Tile key={t.i} disabled={Boolean(answered) || placed.includes(t.i)} style={{ opacity: placed.includes(t.i) ? 0.3 : 1 }} onClick={() => setPlaced((cur) => [...cur, t.i])}>
                  {t.w}
                </Tile>
              ))}
            </div>
            {!answered && (
              <div style={{ display: "flex", gap: 8 }}>
                <MyButton variant="ghost" size="sm" onClick={() => setPlaced([])} disabled={placed.length === 0}>
                  Xóa hết
                </MyButton>
                <MyButton variant="primary" onClick={() => submit(orderSentence(ex))} disabled={placed.length !== ex.words.length}>
                  Kiểm tra
                </MyButton>
              </div>
            )}
          </>
        )}

        {answered && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
            <b style={{ color: answered.correct ? "#059669" : "#dc2626" }}>{answered.correct ? "✓ Chính xác!" : `✗ Chưa đúng. Đáp án: ${answerText(ex)}`}</b>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>{ex.explain}</span>
            <div>
              <MyButton variant="primary" onClick={next}>
                {index + 1 >= prepared.length ? "Xem kết quả" : "Tiếp tục"}
              </MyButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
