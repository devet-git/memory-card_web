import React, { useMemo, useRef, useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { CardLoader } from "components/Loader";
import RequireAI from "components/ai/RequireAI";
import AICancelDialog from "components/ai/AICancelDialog";
import CloseFooter from "components/CloseFooter";
import useAIJob from "hooks/useAIJob";
import { AIConfig, AIImage, askAIJson } from "utils/ai";
import { fileToAIImage } from "utils/image";
import { VisionWord, VISION_PROMPT, VISION_SYSTEM, parseVisionWords } from "utils/visionWords";
import { lookupLocal } from "utils/localDict";
import { WordItem } from "types";

interface Props {
  existingSources: string[];
  onAdd: (words: Omit<WordItem, "id">[]) => void;
  onClose: () => void;
}

function Importer({ config, existingSources, onAdd, onClose }: Props & { config: AIConfig }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<(AIImage & { preview: string }) | null>(null);
  const [drafts, setDrafts] = useState<VisionWord[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const job = useAIJob();

  const existing = useMemo(() => new Set(existingSources.map((s) => s.trim().toLowerCase())), [existingSources]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setDrafts(null);
    setReading(true);
    try {
      setImage(await fileToAIImage(file));
    } catch (err: any) {
      setImage(null);
      setError(err?.message || "Không đọc được ảnh.");
    } finally {
      setReading(false);
    }
  };

  const extract = async () => {
    if (!image || job.busy) return;
    setError(null);
    try {
      const raw = await job.run((signal) =>
        askAIJson<unknown>(VISION_PROMPT, config, { system: VISION_SYSTEM, maxTokens: 3000, signal, images: [{ mediaType: image.mediaType, data: image.data }] })
      );
      if (raw === undefined) return; // cancelled on purpose
      const list = parseVisionWords(raw, existing);
      setDrafts(list);
      setSelected(new Set(list.map((d) => d.word.toLowerCase())));
      if (list.length === 0) setError("Không tìm thấy từ mới nào trong ảnh (hoặc các từ đã có trong bộ thẻ). Hãy thử ảnh rõ nét hơn.");
    } catch (err: any) {
      setError(err?.message || "AI thất bại");
    }
  };

  const toggle = (w: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });

  const add = async () => {
    const picked = (drafts || []).filter((d) => selected.has(d.word.toLowerCase()));
    // fill in the pronunciation from the offline dictionary when the word is there
    const entries = await Promise.all(picked.map((d) => lookupLocal(d.word).catch(() => null)));
    onAdd(
      picked.map((d, i) => ({
        source: d.word,
        target: d.meaning,
        phonetic: entries[i]?.ipa ? `/${entries[i]!.ipa}/` : undefined,
        example: d.example || undefined,
        status: "new" as const,
        starred: false
      }))
    );
    onClose();
  };

  return (
    <MyModal
      title="Thêm từ từ ảnh (AI)"
      onClose={onClose}
      maxWidth="600px"
      footer={
        drafts && drafts.length > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Đã chọn {selected.size} từ</span>
            <div style={{ display: "flex", gap: 8 }}>
              <MyButton variant="ghost" size="sm" onClick={onClose}>
                Hủy
              </MyButton>
              <MyButton variant="primary" size="sm" onClick={add} disabled={selected.size === 0}>
                Thêm {selected.size} thẻ
              </MyButton>
            </div>
          </div>
        ) : (
          <CloseFooter onClose={onClose} />
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Chụp hoặc chọn ảnh trang sách, thực đơn, biển hiệu hay ghi chú tiếng Anh. AI sẽ tìm các từ đáng học và dịch nghĩa. Ảnh được thu nhỏ rồi gửi thẳng từ trình duyệt tới nhà cung cấp AI bằng API key của bạn, không lưu ở đâu khác.
        </p>
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} style={{ display: "none" }} aria-label="Chọn ảnh" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MyButton variant="secondary" onClick={() => fileRef.current?.click()} disabled={reading || job.busy}>
            {image ? "Chọn ảnh khác" : "📷 Chọn hoặc chụp ảnh"}
          </MyButton>
          {image && (
            <MyButton variant="primary" onClick={extract} disabled={job.busy}>
              {job.busy ? "AI đang đọc ảnh..." : "Trích xuất từ vựng"}
            </MyButton>
          )}
        </div>
        {reading && <CardLoader compact label="Đang xử lý ảnh" />}
        {image && <img src={image.preview} alt="Ảnh đã chọn" style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10, alignSelf: "flex-start", border: "1px solid var(--border-color, #e2e8f0)" }} />}
        {job.busy && <CardLoader compact label="AI đang đọc ảnh" />}
        <AICancelDialog job={job} />
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}

        {drafts && drafts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {drafts.map((d) => (
              <label
                key={d.word}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-color, #e2e8f0)", cursor: "pointer" }}
              >
                <input type="checkbox" checked={selected.has(d.word.toLowerCase())} onChange={() => toggle(d.word.toLowerCase())} style={{ marginTop: 4 }} />
                <span style={{ fontSize: 14, lineHeight: 1.45, minWidth: 0 }}>
                  <strong>{d.word}</strong>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.meaning}</div>
                  {d.example && <div style={{ color: "var(--text-secondary)", fontSize: 12.5, fontStyle: "italic" }}>“{d.example}”</div>}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </MyModal>
  );
}

/** Photo -> vocabulary cards, using the user's own AI key (needs a vision-capable model). */
export default function AIImageWordsModal(props: Props) {
  return <RequireAI>{(config) => <Importer {...props} config={config} />}</RequireAI>;
}
