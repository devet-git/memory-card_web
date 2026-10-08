import React, { useMemo, useRef, useState } from "react";
import MyButton from "components/MyButton";
import { SpeakSpinner } from "hooks/useSpeak";
import { CardLoader } from "components/Loader";
import RequireAI from "components/ai/RequireAI";
import { AIConfig, askAIJson } from "utils/ai";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, Feedback, shuffled, useStableWords } from "./shared";
import { MyTextarea } from "components/MyInput";

interface Verdict {
  correct: boolean;
  feedback: string;
  improved?: string;
}

const SYSTEM = `You are a friendly English teacher for Vietnamese learners.
The student writes ONE sentence using a target word. Judge whether the word is used correctly (meaning, grammar, collocation) and whether the sentence is natural.
Return JSON: {"correct": boolean, "feedback": short feedback in Vietnamese (max 2 sentences), "improved": a corrected or more natural version of their sentence (or the same if already good)}.
Be encouraging; minor typos should not make the answer incorrect.`;

function Practice({ config, words: liveWords, onAnswer }: StudyModeProps & { config: AIConfig }) {
  const words = useStableWords(liveWords);
  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffled(words), [words, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const current = order[index];

  const check = async () => {
    if (!current || !sentence.trim() || loading) return;
    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();
    try {
      const prompt = `Target word: "${current.source}" (meaning: ${current.target})\nStudent sentence: "${sentence.trim().slice(0, 500)}"`;
      const result = await askAIJson<Verdict>(prompt, config, { system: SYSTEM, maxTokens: 400, signal: abortRef.current.signal });
      setVerdict(result);
      if (result.correct) setScore((s) => s + 1);
      onAnswer(current.id, Boolean(result.correct));
    } catch (err: any) {
      setError(err?.message || "AI thất bại");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setSentence("");
    setVerdict(null);
    setError(null);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setScore(0);
    setSentence("");
    setVerdict(null);
    setError(null);
  };

  if (words.length === 0) return <ModeCard>Bộ thẻ chưa có từ nào để luyện đặt câu.</ModeCard>;

  if (index >= order.length) {
    return (
      <ModeWrap>
        <ModeCard>
          <h3 style={{ margin: 0 }}>Hoàn thành! {score}/{order.length} câu đạt</h3>
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
          Từ {index + 1}/{order.length}
        </span>
        <span>Đạt: {score}</span>
      </ModeMeta>
      <ModeCard>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Đặt một câu có dùng từ:</p>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{current.source}</div>
        <div style={{ color: "var(--text-secondary)" }}>{current.target}</div>
        <MyTextarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          readOnly={Boolean(verdict)}
          placeholder="Viết câu của bạn..."
          style={{ minHeight: 90, width: "100%" }}
        />
        {loading && <CardLoader compact label="AI đang chấm câu của bạn" />}
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
        {verdict && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", width: "100%" }}>
            <Feedback $ok={verdict.correct}>{verdict.correct ? "Tốt lắm!" : "Cần chỉnh lại"}</Feedback>
            <span style={{ fontSize: 14 }}>{verdict.feedback}</span>
            {verdict.improved && (
              <span style={{ fontSize: 14, color: "#2563eb" }}>
                Gợi ý: <em>{verdict.improved}</em>
              </span>
            )}
          </div>
        )}
        {verdict ? (
          <MyButton variant="primary" onClick={next}>
            Từ tiếp theo
          </MyButton>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <MyButton variant="ghost" onClick={next} disabled={loading}>
              Bỏ qua
            </MyButton>
            <MyButton variant="primary" icon={loading ? <SpeakSpinner /> : undefined} onClick={check} disabled={!sentence.trim() || loading}>
              {loading ? "AI đang chấm..." : "Nhờ AI chấm"}
            </MyButton>
          </div>
        )}
      </ModeCard>
    </ModeWrap>
  );
}

/** Write a sentence with the target word; the user's AI gives feedback. */
export default function SentencePractice(props: StudyModeProps) {
  return <RequireAI>{(config) => <Practice {...props} config={config} />}</RequireAI>;
}
