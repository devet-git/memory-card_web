import React, { useState } from "react";
import MyButton from "components/MyButton";
import { SpeakSpinner } from "hooks/useSpeak";
import { lookupWord, LookupResult } from "utils/dictionary";
import { MdAutoFixHigh } from "react-icons/md";

interface Props {
  word: string;
  onResult: (result: LookupResult) => void;
}

/** Looks the word up online and hands back phonetic / meaning / example for the caller to fill in. */
export default function AutoFillButton({ word, onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading || !word.trim()) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const result = await lookupWord(word);
      if (!result.phonetic && !result.example && !result.translation) {
        setError("Không tìm thấy dữ liệu cho từ này");
      } else {
        // No Vietnamese meaning (offline or unknown word): fall back to the English definition
        if (result.translationSource === "offline") {
          setNote("Nghĩa lấy từ từ điển Wiktionary offline — có thể có nghĩa chưa phù hợp, hãy giữ lại nghĩa đúng.");
          onResult(result);
        } else if (!result.translation && result.definition) {
          setNote("Chưa có nghĩa tiếng Việt — đã dùng định nghĩa tiếng Anh, bạn có thể sửa lại.");
          onResult({ ...result, translation: result.definition });
        } else {
          if (result.baseForm) setNote(`Dạng biến đổi của "${result.baseForm}".`);
          onResult(result);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Tra từ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <MyButton
        type="button"
        variant="outline"
        size="sm"
        icon={loading ? <SpeakSpinner /> : <MdAutoFixHigh />}
        onClick={handleClick}
        disabled={!word.trim()}
        title="Tự điền phiên âm, nghĩa tiếng Việt và ví dụ (từ tiếng Anh)"
      >
        {loading ? "Đang tra từ..." : "Tự điền từ điển"}
      </MyButton>
      {error && <span style={{ color: "#dc2626", fontSize: 12 }}>{error}</span>}
      {note && <span style={{ color: "var(--text-secondary, #64748b)", fontSize: 12 }}>{note}</span>}
    </div>
  );
}
