import React, { useState } from "react";
import MyButton from "components/MyButton";
import AISettingsModal from "components/AISettingsModal";
import { SpeakSpinner } from "hooks/useSpeak";
import useAIConfig from "hooks/useAIConfig";
import { askAIJson } from "utils/ai";
import { LookupResult } from "utils/dictionary";
import { MdAutoAwesome } from "react-icons/md";

interface Props {
  word: string;
  meaning?: string;
  onResult: (result: LookupResult) => void;
}

const SYSTEM = `You help Vietnamese learners build vocabulary flashcards.
Return one JSON object: {"translation": concise Vietnamese meaning, "phonetic": IPA for English words or "", "example": one short natural example sentence using the exact term, "mnemonic": a short, creative Vietnamese memory hint (sound-alike, word root or image), 1 sentence}.`;

/** Asks the user's AI to fill meaning, phonetic, example and a memory hint for a card. */
export default function AIEnrichButton({ word, meaning, onResult }: Props) {
  const config = useAIConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const run = async () => {
    if (!config) {
      setShowSettings(true);
      return;
    }
    if (loading || !word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Term: "${word.trim().slice(0, 200)}"${meaning?.trim() ? `\nIntended meaning: "${meaning.trim().slice(0, 200)}"` : ""}`;
      const result = await askAIJson<LookupResult>(prompt, config, { system: SYSTEM, maxTokens: 400 });
      onResult({
        translation: result.translation || undefined,
        phonetic: result.phonetic || undefined,
        example: result.example || undefined,
        mnemonic: result.mnemonic || undefined
      });
    } catch (err: any) {
      setError(err?.message || "AI thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <div style={{ opacity: config ? 1 : 0.5 }}>
      <MyButton
        type="button"
        variant="outline"
        size="sm"
        icon={loading ? <SpeakSpinner /> : <MdAutoAwesome />}
        onClick={run}
        disabled={!word.trim()}
        title={config ? "AI gợi ý nghĩa, phiên âm, ví dụ và mẹo ghi nhớ" : "Cần nhập API key AI để dùng tính năng này"}
      >
        {loading ? "AI đang soạn..." : config ? "Gợi ý bằng AI" : "Gợi ý bằng AI 🔒"}
      </MyButton>
      </div>
      {!config && <span style={{ fontSize: 12, color: "#b45309" }}>Cần nhập API key AI để dùng — bấm nút để thêm.</span>}
      {error && <span style={{ color: "#dc2626", fontSize: 12 }}>{error}</span>}
      {showSettings && <AISettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
