import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdVolumeUp } from "react-icons/md";
import MyButton from "components/MyButton";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, AnswerInput, Feedback, shuffled, normalizeAnswer, useStableWords } from "./shared";

/** Dictation: listen to the term, type what you hear. */
export default function Dictation({ words: liveWords, onAnswer, speechRate }: StudyModeProps) {
  const words = useStableWords(liveWords);
  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffled(words), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak, isLoading } = useSpeak();

  const current = order[index];
  const finished = index >= order.length;

  const play = useCallback(() => {
    if (current) speak("dictation", current.source, undefined, speechRate);
  }, [current, speak, speechRate]);

  // Auto-play each new word
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(play, 250);
    inputRef.current?.focus();
    return () => clearTimeout(t);
  }, [index, round]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (words.length === 0) return <ModeCard>Bộ thẻ chưa có từ nào để luyện nghe chép.</ModeCard>;

  if (finished) {
    return (
      <ModeWrap>
        <ModeCard>
          <h3 style={{ margin: 0 }}>Hoàn thành! {score}/{order.length} từ đúng</h3>
          <MyButton variant="primary" onClick={restart}>
            Luyện lại
          </MyButton>
        </ModeCard>
      </ModeWrap>
    );
  }

  return (
    <ModeWrap>
      <ModeMeta>
        <span>
          Câu {index + 1}/{order.length}
        </span>
        <span>Đúng: {score}</span>
      </ModeMeta>
      <ModeCard>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Nghe và gõ lại từ bạn nghe được</p>
        <MyButton
          variant="primary"
          size="lg"
          icon={isLoading("dictation") ? <SpeakSpinner /> : <MdVolumeUp />}
          onClick={play}
        >
          Nghe lại
        </MyButton>
        <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <AnswerInput
            ref={inputRef}
            $state={state}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            readOnly={state !== "idle"}
            placeholder="Gõ từ bạn nghe được..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {state !== "idle" && (
            <Feedback $ok={state === "correct"}>
              {state === "correct" ? "Chính xác!" : `Đáp án đúng: ${current.source}`} — {current.target}
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
