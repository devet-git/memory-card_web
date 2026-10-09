import React, { useMemo, useRef, useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyTextarea } from "components/MyInput";
import { CardLoader } from "components/Loader";
import { WordItem } from "types";
import { baseFormSync, formatPos, lookupLocal, prefetch } from "utils/localDict";
import { extractCandidates, tokenize, subtitleToText, MAX_TEXT_LENGTH } from "utils/extractWords";

interface Props {
  existingSources: string[];
  onAdd: (words: Omit<WordItem, "id">[]) => void;
  onClose: () => void;
}

interface Row {
  word: string;
  forms: string[];
  count: number;
  rank: number;
  ipa: string;
  target: string;
  example: string;
}

const MAX_ROWS = 1500; // kept after analysis; the list below shows them a page at a time
const LOOKUP_LIMIT = 3000;
const PAGE = 60;
const LEVELS = [
  { label: "Hiện tất cả", skipTop: 0 },
  { label: "Bỏ 500 từ phổ biến nhất", skipTop: 500 },
  { label: "Bỏ 1000 từ phổ biến nhất", skipTop: 1000 },
  { label: "Bỏ 2000 từ phổ biến nhất", skipTop: 2000 }
];

/** Turns a pasted passage into cards: new words, their offline meanings, and the sentence they came from. */
export default function ExtractWordsModal({ existingSources, onAdd, onClose }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [unknown, setUnknown] = useState(0);
  const [level, setLevel] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(PAGE);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const have = useMemo(() => new Set(existingSources.map((s) => s.trim().toLowerCase())), [existingSources]);
  const visible = useMemo(() => (rows || []).filter((r) => r.rank === 0 || r.rank > LEVELS[level].skipTop), [rows, level]);

  // .srt / .vtt subtitles are cleaned into running text; any other text file is used as it is
  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const subtitles = /\.(srt|vtt|ass|ssa)$/i.test(file.name) || /-->/.test(raw.slice(0, 2000));
      const cleaned = subtitles ? subtitleToText(raw) : raw;
      setText(cleaned.slice(0, MAX_TEXT_LENGTH));
      setRows(null);
      setFileNote(`${file.name}: ${cleaned.length.toLocaleString("vi-VN")} ký tự${subtitles ? " (đã bỏ thời gian và định dạng phụ đề)" : ""}`);
    } catch {
      setFileNote("Không đọc được tệp này.");
    }
  };

  const analyse = async () => {
    setBusy(true);
    setRows(null);
    try {
      await prefetch(tokenize(text.slice(0, MAX_TEXT_LENGTH)).map((t) => t.token));
      const candidates = extractCandidates(text, baseFormSync, have);
      const found: Row[] = [];
      let missing = 0;
      for (const c of candidates.slice(0, LOOKUP_LIMIT)) {
        if (found.length >= MAX_ROWS) break;
        const entry = await lookupLocal(c.word);
        const target = entry ? entry.vi || (entry.def ? `${entry.pos ? `(${formatPos(entry.pos)}) ` : ""}${entry.def}` : "") : "";
        if (!entry || !target) {
          missing++;
          continue;
        }
        found.push({
          word: c.word,
          forms: c.forms,
          count: c.count,
          rank: entry.rank,
          ipa: entry.ipa,
          target,
          example: c.sentence
        });
      }
      setUnknown(missing);
      setShown(PAGE);
      setRows(found);
      const firstLevel = found.filter((r) => r.rank === 0 || r.rank > LEVELS[level].skipTop);
      setSelected(new Set(firstLevel.slice(0, 30).map((r) => r.word)));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (w: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });

  const add = () => {
    const picked = (rows || []).filter((r) => selected.has(r.word));
    onAdd(
      picked.map((r) => ({
        source: r.word,
        target: r.target,
        phonetic: r.ipa ? `/${r.ipa}/` : undefined,
        example: r.example || undefined,
        status: "new" as const,
        starred: false
      }))
    );
    onClose();
  };

  const selectedVisible = visible.filter((r) => selected.has(r.word)).length;

  return (
    <MyModal
      title="Thêm từ từ đoạn văn"
      onClose={onClose}
      maxWidth="640px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{rows ? `Đã chọn ${selected.size} từ` : "Dán văn bản rồi bấm Phân tích"}</span>
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
          Dán một bài báo, email, đoạn truyện hoặc nạp phụ đề phim (.srt). MemCard tìm những từ bạn chưa có, gộp các dạng chia (went, going → go), tự điền nghĩa từ từ điển offline và lấy chính
          câu trong bài làm ví dụ. Toàn bộ xử lý ngay trên trình duyệt.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileRef} type="file" accept=".srt,.vtt,.txt,text/plain" onChange={(e) => loadFile(e.target.files?.[0])} style={{ display: "none" }} aria-label="Chọn tệp phụ đề hoặc văn bản" />
          <MyButton variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            📄 Nạp tệp phụ đề (.srt, .vtt) hoặc .txt
          </MyButton>
          {fileNote && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fileNote}</span>}
        </div>
        <MyTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dán văn bản tiếng Anh vào đây..."
          style={{ minHeight: 140, width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: text.length > MAX_TEXT_LENGTH ? "#dc2626" : "var(--text-secondary)" }}>
            {text.length}/{MAX_TEXT_LENGTH} ký tự{text.length > MAX_TEXT_LENGTH ? " — phần vượt quá sẽ bị bỏ qua" : ""}
          </span>
          <MyButton variant="secondary" size="sm" onClick={analyse} disabled={busy || text.trim().length < 20}>
            {busy ? "Đang phân tích..." : "Phân tích"}
          </MyButton>
        </div>

        {busy && <CardLoader compact label="Đang phân tích văn bản" />}

        {rows && (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                aria-label="Lọc theo độ phổ biến"
                style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit" }}
              >
                {LEVELS.map((l, i) => (
                  <option key={l.label} value={i}>
                    {l.label}
                  </option>
                ))}
              </select>
              <MyButton variant="ghost" size="sm" onClick={() => setSelected(new Set(visible.map((r) => r.word)))}>
                Chọn tất cả ({visible.length})
              </MyButton>
              <MyButton variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={selectedVisible === 0 && selected.size === 0}>
                Bỏ chọn
              </MyButton>
            </div>
            {visible.length === 0 ? (
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Không có từ mới nào phù hợp. Thử đổi bộ lọc độ phổ biến hoặc dán đoạn văn khác.
              </span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visible.slice(0, shown).map((r) => (
                  <label
                    key={r.word}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-color, #e2e8f0)", cursor: "pointer" }}
                  >
                    <input type="checkbox" checked={selected.has(r.word)} onChange={() => toggle(r.word)} style={{ marginTop: 4 }} />
                    <span style={{ fontSize: 14, lineHeight: 1.45, minWidth: 0 }}>
                      <strong>{r.word}</strong> {r.ipa && <span style={{ color: "#3b82f6" }}>/{r.ipa}/</span>}{" "}
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        ×{r.count}
                        {r.forms.length > 1 || r.forms[0] !== r.word ? ` (${r.forms.join(", ")})` : ""}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.target}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 12.5, fontStyle: "italic" }}>“{r.example}”</div>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {visible.length > shown && (
              <div style={{ textAlign: "center" }}>
                <MyButton variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                  Xem thêm ({visible.length - shown} từ)
                </MyButton>
              </div>
            )}
            {unknown > 0 && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Đã bỏ qua {unknown} từ không có trong từ điển (tên riêng, từ viết sai…).</span>
            )}
          </>
        )}
      </div>
    </MyModal>
  );
}
