import React, { useEffect, useMemo, useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { DictEntry, formatPos, loadTopWords } from "utils/localDict";
import { WordItem } from "types";
import { CardLoader } from "components/Loader";

interface Props {
  existingSources: string[];
  onAdd: (words: Omit<WordItem, "id">[]) => void;
  onClose: () => void;
}

const BANDS = [
  { label: "Rất phổ biến", from: 150, to: 1000 },
  { label: "Phổ biến", from: 1000, to: 2000 },
  { label: "Mở rộng", from: 2000, to: 3000 }
];

/** Offers common English words (from the offline dictionary) that aren't in this collection yet. */
export default function SuggestWordsModal({ existingSources, onAdd, onClose }: Props) {
  const [top, setTop] = useState<DictEntry[] | null>(null);
  const [band, setBand] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTopWords().then(setTop);
  }, []);

  const have = useMemo(() => new Set(existingSources.map((s) => s.trim().toLowerCase())), [existingSources]);

  const candidates = useMemo(() => {
    if (!top) return [];
    const { from, to } = BANDS[band];
    return top.filter((e) => e.rank >= from && e.rank < to && (e.def || e.vi) && !e.lemma && !have.has(e.word));
  }, [top, band, have]);

  const PAGE = 15;
  const visible = candidates.slice(page * PAGE, page * PAGE + PAGE);

  const toggle = (w: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });

  const add = () => {
    const words = (top || [])
      .filter((e) => selected.has(e.word))
      .map((e) => ({
        source: e.word,
        target: e.vi || `${e.pos ? `(${formatPos(e.pos)}) ` : ""}${e.def}`,
        phonetic: e.ipa ? `/${e.ipa}/` : undefined,
        example: e.example || undefined,
        status: "new" as const,
        starred: false
      }));
    onAdd(words);
    onClose();
  };

  return (
    <MyModal
      title="Gợi ý từ phổ biến"
      onClose={onClose}
      maxWidth="600px"
      footer={
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
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Các từ tiếng Anh thông dụng chưa có trong bộ này, lấy từ từ điển offline. Mặt sau là nghĩa tiếng Việt (nếu có trong từ điển) hoặc định
          nghĩa tiếng Anh; hãy kiểm tra và giữ lại nghĩa phù hợp.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BANDS.map((b, i) => (
            <MyButton
              key={b.label}
              size="sm"
              variant={band === i ? "primary" : "secondary"}
              onClick={() => {
                setBand(i);
                setPage(0);
              }}
            >
              {b.label}
            </MyButton>
          ))}
        </div>

        {!top && <CardLoader compact label="Đang tải từ điển" />}
        {top && top.length === 0 && <span style={{ fontSize: 13, color: "#dc2626" }}>Không tải được từ điển offline.</span>}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visible.map((e) => (
            <label
              key={e.word}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-color, #e2e8f0)", cursor: "pointer" }}
            >
              <input type="checkbox" checked={selected.has(e.word)} onChange={() => toggle(e.word)} style={{ marginTop: 4 }} />
              <span style={{ fontSize: 14, lineHeight: 1.45 }}>
                <strong>{e.word}</strong> {e.ipa && <span style={{ color: "#3b82f6" }}>/{e.ipa}/</span>}{" "}
                <span style={{ color: "var(--text-muted)" }}>{formatPos(e.pos)}</span>
                {e.vi && <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.vi}</div>}
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{e.def}</div>
              </span>
            </label>
          ))}
        </div>

        {candidates.length > PAGE && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <MyButton variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← Trước
            </MyButton>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {page + 1}/{Math.ceil(candidates.length / PAGE)}
            </span>
            <MyButton variant="ghost" size="sm" disabled={(page + 1) * PAGE >= candidates.length} onClick={() => setPage((p) => p + 1)}>
              Sau →
            </MyButton>
          </div>
        )}
      </div>
    </MyModal>
  );
}
