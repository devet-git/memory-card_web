import React, { useState } from "react";
import MyButton from "components/MyButton";
import AISettingsModal from "components/AISettingsModal";
import useAIConfig from "hooks/useAIConfig";
import { AIConfig } from "utils/ai";

interface Props {
  children: (config: AIConfig) => React.ReactNode;
  message?: string;
}

/** Renders the AI feature once a key is configured; otherwise a prompt to add one. */
export default function RequireAI({ children, message }: Props) {
  const config = useAIConfig();
  const [showSettings, setShowSettings] = useState(false);

  // The settings modal lives outside the branch so it stays open when saving the key flips us to `children`
  const settingsModal = showSettings ? (
    <AISettingsModal onClose={() => setShowSettings(false)} />
  ) : null;

  if (config) {
    return (
      <>
        {children(config)}
        {settingsModal}
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "24px 16px",
          textAlign: "center",
          border: "1px dashed var(--border-color, #cbd5e1)",
          borderRadius: 14,
        }}
      >
        <strong>Tính năng này cần API key AI của bạn</strong>
        <span style={{ fontSize: 13, color: "var(--text-secondary, #64748b)" }}>
          {message ||
            "Thêm API key (Claude, OpenAI hoặc Gemini) để dùng trợ lý AI. Key chỉ lưu trong trình duyệt của bạn."}
        </span>
        <MyButton
          variant="primary"
          size="sm"
          onClick={() => setShowSettings(true)}
        >
          Thêm API key
        </MyButton>
      </div>
      {settingsModal}
    </>
  );
}
