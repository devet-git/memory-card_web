import React, { useEffect, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { BattleQuestion } from "utils/boss";

// One question of a quiz-style game: the prompt, the options (or a typing box) and the feedback after answering.

const Card = styled.div`
  text-align: center;
  padding: 18px 12px;
  border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);

  .label {
    font-size: 12px;
    font-weight: 700;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .prompt {
    margin: 4px 0;
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
  .q {
    font-size: clamp(24px, 6vw, 32px);
    font-weight: 800;
  }
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) {
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
  text-align: center;
  border: 2px solid ${(p) => (p.$state === "right" ? "#10b981" : p.$state === "wrong" ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background: ${(p) => (p.$state === "right" ? "rgba(16,185,129,0.15)" : p.$state === "wrong" ? "rgba(239,68,68,0.15)" : "transparent")};
  opacity: ${(p) => (p.$state === "dim" ? 0.5 : 1)};

  kbd {
    opacity: 0.55;
    margin-right: 6px;
    font-size: 12px;
  }
`;

export interface Reveal {
  correct: boolean;
  picked: string;
}

interface Props {
  question: BattleQuestion;
  reveal: Reveal | null;
  onSubmit: (input: string) => void;
  onNext: () => void;
  nextLabel?: string;
  successText?: string;
}

/** Keys 1-4 pick an option and Enter continues, so a round can be played without the mouse. */
export default function QuestionPanel({ question, reveal, onSubmit, onNext, nextLabel = "Tiếp tục", successText = "✓ Chính xác!" }: Props) {
  const [typed, setTyped] = useState("");

  useEffect(() => setTyped(""), [question]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (reveal) {
        if (e.key === "Enter" && !(e.target as HTMLElement | null)?.closest?.("button")) {
          e.preventDefault();
          onNext();
        }
        return;
      }
      if (question.kind !== "choice") return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < question.options.length) onSubmit(question.options[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, reveal, onSubmit, onNext]);

  const stateOf = (o: string): "idle" | "right" | "wrong" | "dim" => {
    if (!reveal || question.kind !== "choice") return "idle";
    if (o === question.answer) return "right";
    if (o === reveal.picked) return "wrong";
    return "dim";
  };

  return (
    <>
      <Card>
        <div className="label">{question.label}</div>
        <div className="prompt">{question.prompt}</div>
        <div className="q">{question.question}</div>
      </Card>

      {question.kind === "choice" ? (
        <Options>
          {question.options.map((o, i) => (
            <Option key={o} $state={stateOf(o)} disabled={Boolean(reveal)} onClick={() => onSubmit(o)}>
              <kbd>{i + 1}</kbd>
              {o}
            </Option>
          ))}
        </Options>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim() && !reveal) onSubmit(typed);
          }}
          style={{ display: "flex", gap: 8, flexDirection: "column" }}
        >
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={Boolean(reveal)}
            placeholder={question.hint}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Gõ đáp án"
            style={{ padding: "12px 14px", fontSize: 18, borderRadius: 10, border: "2px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit", textAlign: "center" }}
          />
          {!reveal && (
            <MyButton variant="primary" type="submit" disabled={!typed.trim()}>
              Trả lời
            </MyButton>
          )}
        </form>
      )}

      {reveal && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
          <b style={{ color: reveal.correct ? "#059669" : "#dc2626" }}>{reveal.correct ? successText : `✗ Sai rồi. Đáp án: ${question.answer}`}</b>
          <div>
            <MyButton variant="primary" onClick={onNext}>
              {nextLabel}
            </MyButton>
          </div>
        </div>
      )}
    </>
  );
}
