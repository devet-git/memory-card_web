import React, { useMemo, useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import { SpeakSpinner, useSpeak } from "hooks/useSpeak";
import { CardLoader } from "components/Loader";
import RequireAI from "components/ai/RequireAI";
import { AIConfig, askAIJson } from "utils/ai";
import { WordItem } from "types";
import { MdVolumeUp } from "react-icons/md";

interface Props {
  words: WordItem[];
  onClose: () => void;
}

interface Story {
  title: string;
  story: string; // target words wrapped in **...**
  translation: string;
}

const LEVELS = ["Dễ (A2)", "Vừa (B1-B2)", "Khó (C1)"];

const SYSTEM = `You write short reading passages for Vietnamese English learners to review vocabulary in context.
Use EVERY given word naturally, wrapped in double asterisks like **word** (keep the original form of the word when possible).
Return JSON: {"title": short English title, "story": the passage in English, "translation": a faithful Vietnamese translation (keep the ** markers around the Vietnamese equivalents when obvious)}.`;

/** Words you struggle with first, then least-practised ones. */
function pickWords(words: WordItem[], count: number): WordItem[] {
  return [...words]
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0) || (a.reviewCount || 0) - (b.reviewCount || 0))
    .slice(0, count);
}

function Highlighted({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <mark key={i} style={{ background: "rgba(59,130,246,0.18)", color: "inherit", borderRadius: 4, padding: "0 3px", fontWeight: 700 }}>
            {p.slice(2, -2)}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

function Writer({ config, words }: { config: AIConfig; words: WordItem[] }) {
  const [count, setCount] = useState(Math.min(6, Math.max(3, words.length)));
  const [level, setLevel] = useState(LEVELS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const { speak, isLoading } = useSpeak();

  const chosen = useMemo(() => pickWords(words, count), [words, count]);

  const generate = async () => {
    if (loading || chosen.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const list = chosen.map((w) => `${w.source} (${w.target})`).join("\n");
      const result = await askAIJson<Story>(`Level: ${level}\nWords to use:\n${list}`, config, { system: SYSTEM, maxTokens: 1500 });
      if (!result?.story) throw new Error("AI không tạo được đoạn văn. Hãy thử lại.");
      setStory(result);
      setShowTranslation(false);
    } catch (err: any) {
      setError(err?.message || "Tạo đoạn văn thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (words.length < 3) return <p style={{ margin: 0 }}>Cần ít nhất 3 thẻ trong bộ để tạo đoạn văn ôn từ.</p>;

  if (story) {
    const plain = story.story.replace(/\*\*/g, "");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0 }}>{story.title}</h3>
        <p style={{ margin: 0, lineHeight: 1.7, fontSize: 16 }}>
          <Highlighted text={story.story} />
        </p>
        {showTranslation && (
          <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text-secondary)", borderTop: "1px dashed var(--border-color)", paddingTop: 10 }}>
            <Highlighted text={story.translation} />
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MyButton
            variant="ghost"
            size="sm"
            icon={isLoading("story") ? <SpeakSpinner /> : <MdVolumeUp />}
            onClick={() => speak("story", plain)}
          >
            Nghe đoạn văn
          </MyButton>
          <MyButton variant="ghost" size="sm" onClick={() => setShowTranslation((v) => !v)}>
            {showTranslation ? "Ẩn bản dịch" : "Xem bản dịch"}
          </MyButton>
          <MyButton variant="secondary" size="sm" onClick={() => setStory(null)}>
            ← Tạo đoạn khác
          </MyButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
        AI viết một đoạn văn ngắn dùng các từ bạn hay sai hoặc ít ôn nhất để ôn từ trong ngữ cảnh.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 120px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Số từ (3-10)</label>
          <MyInput
            type="number"
            min={3}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.min(10, Math.max(3, Number(e.target.value) || 3)))}
          />
        </div>
        <div style={{ flex: "2 1 220px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Độ khó</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LEVELS.map((l) => (
              <MyButton key={l} size="sm" variant={level === l ? "primary" : "secondary"} onClick={() => setLevel(l)}>
                {l}
              </MyButton>
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13 }}>
        <strong>Từ sẽ dùng:</strong> {chosen.map((w) => w.source).join(", ")}
      </div>
      {loading && <CardLoader compact label="AI đang viết đoạn văn" />}
      {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <MyButton variant="primary" icon={loading ? <SpeakSpinner /> : undefined} onClick={generate} disabled={loading}>
          {loading ? "AI đang viết..." : "Viết đoạn văn"}
        </MyButton>
      </div>
    </div>
  );
}

export default function AIStoryModal({ words, onClose }: Props) {
  return (
    <MyModal title="Đoạn văn ôn từ (AI)" onClose={onClose} maxWidth="620px">
      <RequireAI>{(config) => <Writer config={config} words={words} />}</RequireAI>
    </MyModal>
  );
}
