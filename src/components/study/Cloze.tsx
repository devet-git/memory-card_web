import React, { useEffect, useMemo, useRef, useState } from "react";
import MyButton from "components/MyButton";
import { CardLoader } from "components/Loader";
import { WordItem } from "types";
import { baseFormSync, prefetch } from "utils/localDict";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, AnswerInput, Feedback, shuffled, normalizeAnswer, useStableWords } from "./shared";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TOKEN = /\p{L}+/gu;

export interface ClozeItem {
  word: WordItem;
  text: string; // sentence with the target replaced by a blank
  answer: string; // the form as written in the sentence (may be inflected: "went")
}

/** Words whose shards must be loaded so inflected forms can be matched to their base form. */
export const clozeVocabulary = (word: WordItem): string[] => [word.source, ...(word.example?.match(TOKEN) || [])];

/**
 * Blanks out the target in its example sentence. Single words also match inflected forms
 * ("went" for "go") once the offline dictionary shards are loaded; null if the term isn't in the sentence.
 */
export function buildCloze(word: WordItem): ClozeItem | null {
  const example = word.example;
  const source = word.source.trim();
  if (!example || !source) return null;

  // Exact match first (also covers multi-word phrases)
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(source)})(?![\\p{L}\\p{N}])`, "iu");
  const exact = example.match(re);
  if (exact) {
    return { word, text: example.replace(re, (_m, pre) => `${pre}_____`), answer: exact[2] };
  }

  if (/\s/.test(source)) return null;
  const src = source.toLowerCase();
  const srcBase = baseFormSync(src);
  for (const m of Array.from(example.matchAll(TOKEN))) {
    const token = m[0];
    const lower = token.toLowerCase();
    const base = baseFormSync(lower);
    if (base === src || lower === srcBase || (base === srcBase && base !== lower)) {
      const start = m.index ?? 0;
      return { word, text: example.slice(0, start) + "_____" + example.slice(start + token.length), answer: token };
    }
  }
  return null;
}

/** Fill-in-the-blank on the example sentence. */
export default function Cloze({ words: liveWords, onAnswer }: StudyModeProps) {
  const words = useStableWords(liveWords);
  const [items, setItems] = useState<ClozeItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load dictionary shards for the example sentences, then build the questions
  useEffect(() => {
    let cancelled = false;
    prefetch(words.flatMap(clozeVocabulary))
      .catch(() => {})
      .then(() => {
        if (!cancelled) setItems(words.map(buildCloze).filter((c): c is ClozeItem => c !== null));
      });
    return () => {
      cancelled = true;
    };
  }, [words]);

  const order = useMemo(() => shuffled(items || []), [items, round]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const ok = normalizeAnswer(value) === normalizeAnswer(current.answer);
    setState(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 1);
    onAnswer(current.word.id, ok);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setScore(0);
    setValue("");
    setState("idle");
  };

  if (items === null) return <ModeCard><CardLoader compact label="Đang chuẩn bị câu hỏi" /></ModeCard>;

  if (items.length === 0) {
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

  const inflected = current.answer.toLowerCase() !== current.word.source.trim().toLowerCase();

  return (
    <ModeWrap>
      <ModeMeta>
        <span>
          Câu {index + 1}/{order.length} ({items.length}/{words.length} thẻ có ví dụ phù hợp)
        </span>
        <span>Đúng: {score}</span>
      </ModeMeta>
      <ModeCard>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5 }}>"{current.text}"</p>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Gợi ý nghĩa: {current.word.target}
          {inflected && ` • từ gốc: ${current.word.source} (chia đúng dạng trong câu)`}
        </p>
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
            <Feedback $ok={state === "correct"}>{state === "correct" ? "Chính xác!" : `Đáp án đúng: ${current.answer}`}</Feedback>
          )}
          <MyButton variant="primary" type="submit" disabled={state === "idle" && !value.trim()}>
            {state === "idle" ? "Kiểm tra" : "Câu tiếp theo"}
          </MyButton>
        </form>
      </ModeCard>
    </ModeWrap>
  );
}
