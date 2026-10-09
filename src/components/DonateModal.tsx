import React, { useState } from "react";
import styled from "styled-components";
import {
  MdContentCopy,
  MdCheck,
  MdOutlineQrCodeScanner
} from "react-icons/md";
import MyModal from "./MyModal";
import CloseFooter from "./CloseFooter";
import { MyInput } from "./MyInput";
import MemCardLogo from "./MemCardLogo";
import { effectiveDonate, useSiteConfig } from "utils/siteConfig";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeroBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.12) 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);

  .text {
    h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 700;
      color: #b45309;
    }
    p {
      margin: 0;
      font-size: 12.5px;
      color: var(--text-secondary, #475569);
      line-height: 1.45;
    }
  }
`;

const CoffeeOptionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const CoffeeCard = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 12px;
  border: 2px solid ${(props) => (props.$selected ? "#ea580c" : "var(--border-color, #e2e8f0)")};
  background: ${(props) => (props.$selected ? "rgba(234, 88, 12, 0.08)" : "var(--bg-card, #ffffff)")};
  cursor: pointer;
  transition: all 0.2s ease;

  .icon {
    font-size: 22px;
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    white-space: nowrap;
  }

  .amount {
    font-size: 11px;
    font-weight: 600;
    color: #ea580c;
  }

  &:hover {
    border-color: #ea580c;
    transform: translateY(-2px);
  }
`;

const BankInfoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--bg-tertiary, #f1f5f9);
  border: 1px solid var(--border-color, #e2e8f0);

  .qr-section {
    display: flex;
    align-items: center;
    gap: 16px;

    @media (max-width: 520px) {
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;

      img {
        width: 140px;
        height: 140px;
        border-radius: 10px;
        border: 1px solid var(--border-color, #cbd5e1);
        background: white;
        object-fit: contain;
      }

      .qr-hint {
        font-size: 11px;
        color: var(--text-muted, #94a3b8);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .bank-details {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-size: 13px;

      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed var(--border-color, #cbd5e1);
        padding-bottom: 4px;

        .label {
          color: var(--text-muted, #94a3b8);
          font-size: 12px;
        }

        .val {
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          display: flex;
          align-items: center;
          gap: 6px;

          button {
            background: none;
            border: none;
            cursor: pointer;
            color: #3b82f6;
            display: inline-flex;
            align-items: center;
            padding: 2px;
            font-size: 14px;
            transition: transform 0.1s;

            &:hover {
              transform: scale(1.15);
            }
          }
        }
      }
    }
  }
`;

interface DonateModalProps {
  onClose: () => void;
}

export default function DonateModal({ onClose }: DonateModalProps) {
  const [selectedTier, setSelectedTier] = useState<number>(20000);
  const [customAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [supporterName, setSupporterName] = useState("");

  // The account is the owner's (set in the admin console, see utils/siteConfig.ts)
  const bankConfig = effectiveDonate(useSiteConfig());

  const activeAmount = isCustom ? Number(customAmount) || 20000 : selectedTier;
  const transferContent = `Ung ho MemCard ${supporterName ? supporterName.trim() : ""}`.trim();

  // VietQR Quick Link
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${activeAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <MyModal
      title="Ủng hộ tác giả (Buy Me a Coffee) ☕"
      onClose={onClose}
      maxWidth="560px"
      footer={<CloseFooter onClose={onClose} />}
    >
      <Container>
        <HeroBanner>
          <MemCardLogo size={48} showText={false} />
          <div className="text">
            <h4>Cảm ơn bạn đã đồng hành cùng MemCard!</h4>
            <p>
              Mỗi tách cà phê là một nguồn động lực to lớn giúp duy trì máy chủ, nghiên cứu thêm nhiều tính năng học tập thông minh và giữ ứng dụng 100% miễn phí cho cộng đồng.
            </p>
          </div>
        </HeroBanner>

        {/* TIER SELECTION */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Chọn mức cà phê muốn mời:
            </label>
          </div>

          <CoffeeOptionRow>
            <CoffeeCard
              $selected={!isCustom && selectedTier === 10000}
              onClick={() => {
                setSelectedTier(10000);
                setIsCustom(false);
              }}
            >
              <span className="icon">🍵</span>
              <span className="label">Trà đá</span>
              <span className="amount">10.000đ</span>
            </CoffeeCard>

            <CoffeeCard
              $selected={!isCustom && selectedTier === 20000}
              onClick={() => {
                setSelectedTier(20000);
                setIsCustom(false);
              }}
            >
              <span className="icon">☕</span>
              <span className="label">1 Ly Cà phê</span>
              <span className="amount">20.000đ</span>
            </CoffeeCard>

            <CoffeeCard
              $selected={!isCustom && selectedTier === 50000}
              onClick={() => {
                setSelectedTier(50000);
                setIsCustom(false);
              }}
            >
              <span className="icon">☕☕</span>
              <span className="label">2 Ly Cà phê</span>
              <span className="amount">50.000đ</span>
            </CoffeeCard>

            <CoffeeCard
              $selected={!isCustom && selectedTier === 100000}
              onClick={() => {
                setSelectedTier(100000);
                setIsCustom(false);
              }}
            >
              <span className="icon">🍰☕</span>
              <span className="label">Bánh & Cà phê</span>
              <span className="amount">100.000đ</span>
            </CoffeeCard>
          </CoffeeOptionRow>
        </div>

        {/* BANK INFO & QR CODE */}
        <BankInfoCard>
          <div className="qr-section">
            <div className="qr-box">
              <img src={qrUrl} alt="Mã VietQR ủng hộ" />
              <span className="qr-hint">
                <MdOutlineQrCodeScanner /> Quét bằng Banking / MoMo
              </span>
            </div>

            <div className="bank-details">
              <div className="row">
                <span className="label">Ngân hàng:</span>
                <span className="val">{bankConfig.bankName}</span>
              </div>

              <div className="row">
                <span className="label">Số tài khoản:</span>
                <span className="val">
                  <code>{bankConfig.accountNo}</code>
                  <button
                    onClick={() => copyToClipboard(bankConfig.accountNo, "stk")}
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === "stk" ? <MdCheck color="#10b981" /> : <MdContentCopy />}
                  </button>
                </span>
              </div>

              <div className="row">
                <span className="label">Chủ tài khoản:</span>
                <span className="val">{bankConfig.accountName}</span>
              </div>

              <div className="row">
                <span className="label">Số tiền:</span>
                <span className="val" style={{ color: "#ea580c" }}>
                  {activeAmount.toLocaleString("vi-VN")} đ
                  <button
                    onClick={() => copyToClipboard(String(activeAmount), "amount")}
                    title="Sao chép số tiền"
                  >
                    {copiedField === "amount" ? <MdCheck color="#10b981" /> : <MdContentCopy />}
                  </button>
                </span>
              </div>

              <div className="row">
                <span className="label">Nội dung:</span>
                <span className="val" style={{ fontSize: "12px" }}>
                  {transferContent}
                  <button
                    onClick={() => copyToClipboard(transferContent, "content")}
                    title="Sao chép nội dung"
                  >
                    {copiedField === "content" ? <MdCheck color="#10b981" /> : <MdContentCopy />}
                  </button>
                </span>
              </div>
            </div>
          </div>
        </BankInfoCard>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13.5px", fontWeight: 700 }}>Tên của bạn (không bắt buộc, sẽ ghi vào nội dung chuyển khoản):</label>
          <MyInput placeholder="Tên hoặc nickname..." value={supporterName} onChange={(e) => setSupporterName(e.target.value)} />
        </div>
      </Container>
    </MyModal>
  );
}
