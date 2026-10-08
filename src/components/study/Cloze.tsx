import React, { useEffect, useMemo, useRef, useState } from "react";
import MyButton from "components/MyButton";
import { WordItem } from "types";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, AnswerInput, Feedback, shuffled, normalizeAnswer, useStableWords } from "./shared";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces the term inside its example sentence with a blank; null if the term isn't in the sentence. */
export function makeCloze(word: WordItem): string | null {
  if (!word.example) return null;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(word.source.trim())})(?![\\p{L}\\p{N}])`, "iu");
  if (!re.test(word.example)) return null;
  return word.example.replace(re, (_m, pre) => `${pre}_____`);
}

/** Fill-in-the-blank on the example sentence. */
export default function Cloze({ words: liveWords, onAnswer }: StudyModeProps) {
  const words = useStableWords(liveWords);
  const playable = useMemo(() => words.filter((w) => makeCloze(w) !== null), [words]);
  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffled(playable), [playable, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, round]);

  const current = order[index];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    if (state !== "idle") {
      setIndex((i) => i + 1);
      setValue("");
      setState("idle");
      return;
    }
    const ok = normalizeAnswer(value) === normalizeAnswer(current.source);
    setState(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 1);
    onAnswer(current.id, ok);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setScore(0);
    setValue("");
    setState("idle");
  };

  if (playable.length === 0) {
    return (
      <ModeCard>
        Chế độ điền từ cần thẻ có câu ví dụ chứa từ vựng. Hãy thêm ví dụ cho thẻ (có thể dùng "Tự điền từ điển").
      </ModeCard>
    );
  }

  if (index >= order.length) {
    return (
      <ModeWrap>
        <ModeCard>
          <h3 style={{ margin: 0 }}>Hoàn thành! {score}/{order.length} câu đúng</h3>
          <MyButton variant="primary" onClick={restart}>
            Làm lại
          </MyButton>
        </ModeCard>
      </ModeWrap>
    );
  }

  return (
    <ModeWrap>
      <ModeMeta>
        <span>
          Câu {index + 1}/{order.length} ({playable.length}/{words.length} thẻ có ví dụ phù hợp)
        </span>
        <span>Đúng: {score}</span>
      </ModeMeta>
      <ModeCard>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5 }}>"{makeCloze(current)}"</p>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Gợi ý nghĩa: {current.target}</p>
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <AnswerInput
            ref={inputRef}
            $state={state}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            readOnly={state !== "idle"}
            placeholder="Điền từ còn thiếu..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {state !== "idle" && (
            <Feedback $ok={state === "correct"}>
              {state === "correct" ? "Chính xác!" : `Đáp án đúng: ${current.source}`}
            </Feedback>
          )}
          <MyButton variant="primary" type="submit" disabled={state === "idle" && !value.trim()}>
            {state === "idle" ? "Kiểm tra" : "Câu tiếp theo"}
          </MyButton>
        </form>
      </ModeCard>
    </ModeWrap>
  );
}
