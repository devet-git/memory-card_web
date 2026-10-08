import React, { useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import { SpeakSpinner } from "hooks/useSpeak";
import useAIConfig from "hooks/useAIConfig";
import { AI_PROVIDERS, AIProvider, askAI, saveAIConfig } from "utils/ai";

interface Props {
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700 };

export default function AISettingsModal({ onClose }: Props) {
  const saved = useAIConfig();
  const [provider, setProvider] = useState<AIProvider>(saved?.provider || "anthropic");
  const [apiKey, setApiKey] = useState(saved?.apiKey || "");
  const [model, setModel] = useState(saved?.model || AI_PROVIDERS[saved?.provider || "anthropic"].defaultModel);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const info = AI_PROVIDERS[provider];

  const changeProvider = (p: AIProvider) => {
    setProvider(p);
    setModel(AI_PROVIDERS[p].defaultModel);
    setStatus(null);
  };

  const save = () => {
    saveAIConfig({ provider, apiKey, model: model.trim() || info.defaultModel });
    setStatus({ ok: true, text: apiKey.trim() ? "Đã lưu API key trên trình duyệt này." : "Đã xóa API key." });
  };

  const test = async () => {
    if (!apiKey.trim() || testing) return;
    setTesting(true);
    setStatus(null);
    try {
      const reply = await askAI("Reply with the single word: OK", { provider, apiKey: apiKey.trim(), model: model.trim() || info.defaultModel }, { maxTokens: 16 });
      saveAIConfig({ provider, apiKey, model: model.trim() || info.defaultModel });
      setStatus({ ok: true, text: `Kết nối thành công (phản hồi: "${reply.trim().slice(0, 30)}"). Đã lưu cấu hình.` });
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message || "Kết nối thất bại" });
    } finally {
      setTesting(false);
    }
  };

  const remove = () => {
    saveAIConfig(null);
    setApiKey("");
    setStatus({ ok: true, text: "Đã xóa API key khỏi trình duyệt." });
  };

  return (
    <MyModal title="Trợ lý AI (dùng API key của bạn)" onClose={onClose} maxWidth="520px">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(59,130,246,0.1)", color: "#1d4ed8", fontSize: 13, lineHeight: 1.5 }}>
          MemCard không có máy chủ AI riêng: bạn dán API key của mình và trình duyệt gọi thẳng tới nhà cung cấp. Key chỉ lưu trong trình duyệt này,
          không nằm trong tệp sao lưu hay Google Drive. Chi phí tính vào tài khoản API của bạn. Nội dung thẻ bạn gửi cho AI sẽ được xử lý bởi nhà
          cung cấp đã chọn. Đừng dùng key trên máy dùng chung.
        </div>

        <div>
          <label style={labelStyle}>Nhà cung cấp</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => (
              <MyButton key={p} size="sm" variant={provider === p ? "primary" : "secondary"} onClick={() => changeProvider(p)}>
                {AI_PROVIDERS[p].label}
              </MyButton>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>API key</label>
          <div style={{ display: "flex", gap: 8 }}>
            <MyInput
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={info.keyHint}
              autoComplete="off"
              spellCheck={false}
            />
            <MyButton variant="ghost" size="sm" onClick={() => setShowKey((v) => !v)}>
              {showKey ? "Ẩn" : "Hiện"}
            </MyButton>
          </div>
          <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb" }}>
            Lấy API key {info.label} →
          </a>
        </div>

        <div>
          <label style={labelStyle}>Model</label>
          <MyInput value={model} onChange={(e) => setModel(e.target.value)} placeholder={info.defaultModel} spellCheck={false} />
          <span style={{ fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
            Mặc định: {info.defaultModel}. Có thể đổi sang model khác mà tài khoản của bạn hỗ trợ.
          </span>
        </div>

        {status && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              background: status.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: status.ok ? "#059669" : "#dc2626"
            }}
          >
            {status.text}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {saved && (
            <MyButton variant="danger" size="sm" onClick={remove}>
              Xóa key
            </MyButton>
          )}
          <MyButton variant="secondary" size="sm" onClick={save}>
            Lưu
          </MyButton>
          <MyButton variant="primary" size="sm" icon={testing ? <SpeakSpinner /> : undefined} onClick={test} disabled={!apiKey.trim()}>
            {testing ? "Đang kiểm tra..." : "Kiểm tra & lưu"}
          </MyButton>
        </div>
      </div>
    </MyModal>
  );
}
