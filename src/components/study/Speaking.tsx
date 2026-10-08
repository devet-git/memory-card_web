import React, { useEffect, useMemo, useRef, useState } from "react";
import { MdMic, MdVolumeUp } from "react-icons/md";
import MyButton from "components/MyButton";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, Feedback, shuffled, normalizeAnswer, useStableWords } from "./shared";

// Web Speech recognition isn't in the TS 4.x DOM typings
const getRecognition = (): any => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Speech recognition is forgiving: accept a close match (about 80% similar). */
export function isCloseEnough(heard: string, expected: string): boolean {
  const a = normalizeAnswer(heard);
  const b = normalizeAnswer(expected);
  if (!a || !b) return false;
  if (a === b || a.includes(b)) return true;
  const similarity = 1 - distance(a, b) / Math.max(a.length, b.length);
  return similarity >= 0.8;
}

/** Say the term out loud; the browser's speech recognition checks your pronunciation. */
export default function Speaking({ words: liveWords, onAnswer, speechRate }: StudyModeProps) {
  const words = useStableWords(liveWords);
  const supported = typeof window !== "undefined" && Boolean(getRecognition());
  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffled(words), [words, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const recRef = useRef<any>(null);
  const { speak, isLoading } = useSpeak();

  const current = order[index];

  useEffect(() => () => recRef.current?.abort?.(), []);

  const listen = () => {
    if (!current || listening) return;
    const Rec = getRecognition();
    const rec = new Rec();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    setError(null);
    setHeard(null);
    setOk(null);
    setListening(true);

    rec.onresult = (e: any) => {
      const alternatives: string[] = Array.from(e.results[0] || []).map((r: any) => r.transcript);
      const match = alternatives.some((t) => isCloseEnough(t, current.source));
      setHeard(alternatives[0] || "");
      setOk(match);
      if (match) setScore((s) => s + 1);
      onAnswer(current.id, match);
    };
    rec.onerror = (e: any) => {
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Bạn chưa cho phép dùng micro cho trang này."
          : e.error === "no-speech"
            ? "Không nghe thấy giọng nói, hãy thử lại."
            : "Không nhận dạng được giọng nói, hãy thử lại."
      );
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setHeard(null);
    setOk(null);
    setError(null);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setScore(0);
    setHeard(null);
    setOk(null);
    setError(null);
  };

  if (!supported) {
    return (
      <ModeCard>
        Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome, Edge hoặc Safari mới. (Lưu ý: nhiều trình duyệt gửi âm thanh tới máy
        chủ của hãng để nhận dạng.)
      </ModeCard>
    );
  }
  if (words.length === 0) return <ModeCard>Bộ thẻ chưa có từ nào để luyện nói.</ModeCard>;

  if (index >= order.length) {
    return (
      <ModeWrap>
        <ModeCard>
          <h3 style={{ margin: 0 }}>Hoàn thành! {score}/{order.length} từ phát âm đạt</h3>
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
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Hãy đọc to từ này (tiếng Anh):</p>
        <div style={{ fontSize: 32, fontWeight: 800 }}>{current.source}</div>
        {current.phonetic && <div style={{ color: "#3b82f6", fontFamily: "monospace" }}>{current.phonetic}</div>}
        <div style={{ color: "var(--text-secondary)" }}>{current.target}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <MyButton
            variant="ghost"
            icon={isLoading("speaking") ? <SpeakSpinner /> : <MdVolumeUp />}
            onClick={() => speak("speaking", current.source, undefined, speechRate)}
          >
            Nghe mẫu
          </MyButton>
          <MyButton variant="primary" icon={listening ? <SpeakSpinner /> : <MdMic />} onClick={listen} disabled={listening}>
            {listening ? "Đang nghe..." : heard === null ? "Bấm để nói" : "Nói lại"}
          </MyButton>
        </div>
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
        {heard !== null && (
          <>
            <Feedback $ok={Boolean(ok)}>{ok ? "Phát âm tốt!" : "Chưa khớp, thử lại nhé"}</Feedback>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Máy nghe được: "{heard || "..."}"</div>
          </>
        )}
        <MyButton variant={ok ? "primary" : "ghost"} size="sm" onClick={next} disabled={listening}>
          {ok ? "Từ tiếp theo" : "Bỏ qua"}
        </MyButton>
      </ModeCard>
    </ModeWrap>
  );
}
