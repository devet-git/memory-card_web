import React, { useState } from "react";
import styled from "styled-components";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import { SpeakSpinner } from "hooks/useSpeak";
import useAIConfig from "hooks/useAIConfig";
import { AI_PROVIDERS, AIProvider, askAI, saveAIConfig } from "utils/ai";

interface Props {
  onClose: () => void;
}

const PROVIDER_NOTES: Record<AIProvider, string> = {
  anthropic: "Claude — viết tự nhiên, giải thích tốt",
  openai: "GPT — phổ biến, nhiều model",
  gemini: "Gemini — có gói miễn phí giới hạn"
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-primary, #f8fafc);

  h4 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
  }

  .step {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #3b82f6;
    color: #fff;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .hint {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
    line-height: 1.45;
  }
`;

const ProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const ProviderCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary, #0f172a);
  background: var(--bg-card, #ffffff);
  border: 2px solid ${(p) => (p.$active ? "#3b82f6" : "var(--border-color, #e2e8f0)")};
  box-shadow: ${(p) => (p.$active ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none")};

  strong {
    font-size: 14px;
  }

  span {
    font-size: 11.5px;
    color: var(--text-secondary, #64748b);
    line-height: 1.35;
  }
`;

const Privacy = styled.details`
  font-size: 12.5px;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  padding: 8px 12px;
  line-height: 1.5;

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0 0;
  }
`;

const Status = styled.div<{ $ok: boolean }>`
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 10px;
  background: ${(p) => (p.$ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)")};
  color: ${(p) => (p.$ok ? "#059669" : "#dc2626")};
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;

  .right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }
`;

export default function AISettingsModal({ onClose }: Props) {
  const saved = useAIConfig();
  const [provider, setProvider] = useState<AIProvider>(saved?.provider || "anthropic");
  const [apiKey, setApiKey] = useState(saved?.apiKey || "");
  const [model, setModel] = useState(saved?.model || AI_PROVIDERS[saved?.provider || "anthropic"].defaultModel);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const info = AI_PROVIDERS[provider];
  const effectiveModel = model.trim() || info.defaultModel;

  const changeProvider = (p: AIProvider) => {
    setProvider(p);
    setModel(AI_PROVIDERS[p].defaultModel);
    setStatus(null);
  };

  const save = () => {
    saveAIConfig({ provider, apiKey, model: effectiveModel });
    setStatus({ ok: true, text: apiKey.trim() ? "Đã lưu API key trên trình duyệt này." : "Đã xóa API key." });
  };

  const test = async () => {
    if (!apiKey.trim() || testing) return;
    setTesting(true);
    setStatus(null);
    try {
      const reply = await askAI("Reply with the single word: OK", { provider, apiKey: apiKey.trim(), model: effectiveModel }, { maxTokens: 16 });
      saveAIConfig({ provider, apiKey, model: effectiveModel });
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

  const footer = (
    <>
      {status && <Status $ok={status.ok}>{status.text}</Status>}
      <FooterRow>
        {saved && (
          <MyButton variant="ghost" size="sm" onClick={remove} title="Xóa key khỏi trình duyệt này">
            Xóa key
          </MyButton>
        )}
        <div className="right">
          <MyButton variant="secondary" size="sm" onClick={save}>
            Lưu
          </MyButton>
          <MyButton variant="primary" size="sm" icon={testing ? <SpeakSpinner /> : undefined} onClick={test} disabled={!apiKey.trim() || testing}>
            {testing ? "Đang kiểm tra..." : "Kiểm tra & lưu"}
          </MyButton>
        </div>
      </FooterRow>
    </>
  );

  return (
    <MyModal title="Cấu hình Token & Khóa AI" onClose={onClose} maxWidth="560px" footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Privacy>
          <summary>🔒 Key của bạn chỉ lưu trong trình duyệt này</summary>
          <p>
            MemCard không có máy chủ AI: trình duyệt gọi thẳng tới nhà cung cấp bạn chọn. Key không nằm trong tệp sao lưu hay Google Drive. Chi phí
            tính vào tài khoản API của bạn, và nội dung thẻ gửi cho AI sẽ do nhà cung cấp đó xử lý. Đừng dùng key trên máy dùng chung.
          </p>
        </Privacy>

        <Section>
          <h4>
            <span className="step">1</span> Chọn nhà cung cấp
          </h4>
          <ProviderGrid>
            {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => (
              <ProviderCard key={p} type="button" $active={provider === p} onClick={() => changeProvider(p)}>
                <strong>{AI_PROVIDERS[p].label}</strong>
                <span>{PROVIDER_NOTES[p]}</span>
              </ProviderCard>
            ))}
          </ProviderGrid>
        </Section>

        <Section>
          <h4>
            <span className="step">2</span> Nhập API key
          </h4>
          <div style={{ display: "flex", gap: 8 }}>
            <MyInput
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={info.keyHint}
              autoComplete="off"
              spellCheck={false}
            />
            <MyButton variant="secondary" size="sm" onClick={() => setShowKey((v) => !v)}>
              {showKey ? "Ẩn" : "Hiện"}
            </MyButton>
          </div>
          <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="hint" style={{ color: "#2563eb" }}>
            Chưa có key? Tạo tại trang của {info.label} →
          </a>
        </Section>

        <Section>
          <h4>
            <span className="step">3</span> Model <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-secondary)" }}>(tùy chọn)</span>
          </h4>
          <div style={{ display: "flex", gap: 8 }}>
            <MyInput value={model} onChange={(e) => setModel(e.target.value)} placeholder={info.defaultModel} spellCheck={false} />
            <MyButton variant="secondary" size="sm" onClick={() => setModel(info.defaultModel)} disabled={model === info.defaultModel}>
              Mặc định
            </MyButton>
          </div>
          <span className="hint">
            Mặc định: <code>{info.defaultModel}</code>. Có thể đổi sang model khác mà tài khoản của bạn hỗ trợ.
          </span>
        </Section>
      </div>
    </MyModal>
  );
}
