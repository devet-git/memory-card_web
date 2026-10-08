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

  const handleClick = async () => {
    if (loading || !word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await lookupWord(word);
      if (!result.phonetic && !result.example && !result.translation) {
        setError("Không tìm thấy dữ liệu cho từ này");
      } else {
        onResult(result);
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
    </div>
  );
}
