import React, { useMemo, useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput, MyTextarea } from "components/MyInput";
import { SpeakSpinner } from "hooks/useSpeak";
import { CardLoader } from "components/Loader";
import RequireAI from "components/ai/RequireAI";
import useAIJob, { AI_CANCEL_MESSAGE } from "hooks/useAIJob";
import useAIConfig from "hooks/useAIConfig";
import AICancelDialog from "components/ai/AICancelDialog";
import CloseFooter from "components/CloseFooter";
import { AIConfig, askAIJson } from "utils/ai";
import { WordItem } from "types";

interface Props {
  existingSources: string[];
  onAdd: (words: Omit<WordItem, "id">[]) => void;
  onClose: () => void;
}

interface Draft {
  source: string;
  target: string;
  phonetic?: string;
  example?: string;
  mnemonic?: string;
}

const LEVELS = ["Người mới (A1-A2)", "Trung cấp (B1-B2)", "Nâng cao (C1-C2)"];

const SYSTEM = `You create vocabulary flashcards for Vietnamese learners.
Return a JSON array. Each item: {"source": term or short phrase in the language being learned, "target": its Vietnamese meaning (concise), "phonetic": IPA for English terms or "", "example": one short natural example sentence using the exact term, "mnemonic": a short Vietnamese memory hint or ""}.
No duplicates. Keep every field short.`;

function Generator({
  config,
  existingSources,
  onAdd,
  onClose,
}: Props & { config: AIConfig }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState(LEVELS[1]);
  const job = useAIJob();
  const loading = job.busy;
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const existing = useMemo(
    () => new Set(existingSources.map((s) => s.trim().toLowerCase())),
    [existingSources],
  );

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setError(null);
    try {
      const prompt = `Create exactly ${count} flashcards.\nLevel: ${level}.\nTopic or source text (may be a topic, a list of words, or a passage to extract vocabulary from):\n"""\n${topic.trim().slice(0, 4000)}\n"""\nUse English as the language being learned unless the text is clearly another language.`;
      const result = await job.run((signal) =>
        askAIJson<Draft[]>(prompt, config, {
          system: SYSTEM,
          maxTokens: 4096,
          signal,
        }),
      );
      if (result === undefined) return; // cancelled on purpose
      const list = (Array.isArray(result) ? result : [])
        .filter(
          (d) =>
            d &&
            typeof d.source === "string" &&
            typeof d.target === "string" &&
            d.source.trim() &&
            d.target.trim(),
        )
        .slice(0, 50);
      if (list.length === 0)
        throw new Error("AI không tạo được thẻ nào. Hãy mô tả chủ đề rõ hơn.");
      setDrafts(list);
      setSelected(
        new Set(
          list
            .map((d, i) =>
              existing.has(d.source.trim().toLowerCase()) ? -1 : i,
            )
            .filter((i) => i >= 0),
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Tạo thẻ thất bại");
    }
  };

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const addSelected = () => {
    const words = drafts
      .filter((_, i) => selected.has(i))
      .map((d) => ({
        source: d.source.trim(),
        target: d.target.trim(),
        phonetic: d.phonetic?.trim() || undefined,
        example: d.example?.trim() || undefined,
        mnemonic: d.mnemonic?.trim() || undefined,
        status: "new" as const,
        starred: false,
      }));
    onAdd(words);
    onClose();
  };

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {drafts.length === 0 ? (
        <>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Chủ đề hoặc đoạn văn nguồn
            </label>
            <MyTextarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Từ vựng đi sân bay, hoặc dán một đoạn văn để AI trích từ khó..."
              style={{ minHeight: 110 }}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Số thẻ (3-30)
              </label>
              <MyInput
                type="number"
                min={3}
                max={30}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.min(30, Math.max(3, Number(e.target.value) || 3)),
                  )
                }
              />
            </div>
            <div style={{ flex: "2 1 200px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Trình độ
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LEVELS.map((l) => (
                  <MyButton
                    key={l}
                    size="sm"
                    variant={level === l ? "primary" : "secondary"}
                    onClick={() => setLevel(l)}
                  >
                    {l}
                  </MyButton>
                ))}
              </div>
            </div>
          </div>
          {loading && <CardLoader compact label="AI đang soạn thẻ" />}
          {error && (
            <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>
          )}
        </>
      ) : (
        <>
          <p
            style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}
          >
            Chọn các thẻ muốn thêm. Thẻ có từ đã tồn tại trong bộ được bỏ chọn
            sẵn. Nên kiểm tra lại nội dung do AI tạo.
          </p>
          <div
            style={{
              maxHeight: 340,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {drafts.map((d, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color, #e2e8f0)",
                  cursor: "pointer",
                  opacity: existing.has(d.source.trim().toLowerCase())
                    ? 0.6
                    : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  style={{ marginTop: 4 }}
                />
                <span style={{ fontSize: 14, lineHeight: 1.45 }}>
                  <strong>{d.source}</strong>{" "}
                  {d.phonetic && (
                    <span style={{ color: "#3b82f6" }}>{d.phonetic}</span>
                  )}{" "}
                  — {d.target}
                  {existing.has(d.source.trim().toLowerCase()) && (
                    <em style={{ color: "#d97706" }}> (đã có trong bộ)</em>
                  )}
                  {d.example && (
                    <div
                      style={{ color: "var(--text-secondary)", fontSize: 13 }}
                    >
                      "{d.example}"
                    </div>
                  )}
                  {d.mnemonic && (
                    <div style={{ color: "#b45309", fontSize: 12 }}>
                      💡 {d.mnemonic}
                    </div>
                  )}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const footer =
    drafts.length === 0 ? (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {loading ? (
          <MyButton
            variant="danger"
            onClick={() => job.requestCancel()}
            title="Dừng yêu cầu AI đang chạy"
          >
            Hủy yêu cầu AI
          </MyButton>
        ) : (
          <MyButton variant="ghost" onClick={onClose}>
            Hủy
          </MyButton>
        )}
        <MyButton
          variant="primary"
          icon={loading ? <SpeakSpinner /> : undefined}
          onClick={generate}
          disabled={!topic.trim() || loading}
        >
          {loading ? "AI đang tạo thẻ..." : "Tạo thẻ"}
        </MyButton>
      </div>
    ) : (
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
      >
        <MyButton variant="ghost" onClick={() => setDrafts([])}>
          ← Tạo lại
        </MyButton>
        <MyButton
          variant="primary"
          onClick={addSelected}
          disabled={selected.size === 0}
        >
          Thêm {selected.size} thẻ vào bộ
        </MyButton>
      </div>
    );

  return (
    <MyModal
      title="Tạo thẻ bằng AI"
      onClose={onClose}
      maxWidth="620px"
      footer={footer}
      guard={{
        when: loading,
        title: "Hủy yêu cầu AI?",
        message: AI_CANCEL_MESSAGE,
        confirmLabel: "Hủy và đóng",
        stayLabel: "Tiếp tục chờ",
      }}
    >
      {inner}
      <AICancelDialog job={job} />
    </MyModal>
  );
}

export default function AIGenerateModal(props: Props) {
  const config = useAIConfig();
  if (!config) {
    // No key yet: same window, with the prompt to add one
    return (
      <MyModal
        title="Tạo thẻ bằng AI"
        onClose={props.onClose}
        maxWidth="620px"
        footer={<CloseFooter onClose={props.onClose} label="Đóng" />}
      >
        <RequireAI>{() => null}</RequireAI>
      </MyModal>
    );
  }
  return <Generator {...props} config={config} />;
}
