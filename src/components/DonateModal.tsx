import React, { useState } from "react";
import styled from "styled-components";
import {
  MdContentCopy,
  MdCheck,
  MdFavorite
} from "react-icons/md";
import { IoCafeOutline } from "react-icons/io5";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import { MyInput, MyTextarea } from "./MyInput";
import MemCardLogo from "./MemCardLogo";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const HeroBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.12) 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);

  .text {
    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 700;
      color: #b45309;
    }
    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary, #475569);
      line-height: 1.4;
    }
  }
`;

const CoffeeOptionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CoffeeCard = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 2px solid ${(props) => (props.$selected ? "#ea580c" : "var(--border-color, #e2e8f0)")};
  background: ${(props) => (props.$selected ? "rgba(234, 88, 12, 0.08)" : "var(--bg-card, #ffffff)")};
  cursor: pointer;
  transition: all 0.2s ease;

  .icon {
    font-size: 26px;
  }

  .label {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
  }

  .amount {
    font-size: 12px;
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
  padding: 16px;
  border-radius: 14px;
  background: var(--bg-tertiary, #f1f5f9);
  border: 1px solid var(--border-color, #e2e8f0);

  .qr-section {
    display: flex;
    align-items: center;
    gap: 16px;

    @media (max-width: 480px) {
      flex-direction: column;
    }

    img {
      width: 140px;
      height: 140px;
      border-radius: 10px;
      border: 1px solid var(--border-color, #cbd5e1);
      background: white;
      object-fit: contain;
      flex-shrink: 0;
    }

    .bank-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;

      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed var(--border-color, #cbd5e1);
        padding-bottom: 4px;

        .label {
          color: var(--text-muted, #94a3b8);
        }

        .val {
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          display: flex;
          align-items: center;
          gap: 6px;
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
  const [copiedSTK, setCopiedSTK] = useState(false);
  const [supporterName, setSupporterName] = useState("");
  const [supporterMessage, setSupporterMessage] = useState("");
  const [sentThankYou, setSentThankYou] = useState(false);

  const bankAccount = "0335888999";
  const bankName = "MB Bank (Quân Đội)";
  const accountHolder = "DEVET / MEMCARD";
  const transferContent = `Ung ho MemCard ${supporterName ? supporterName.trim() : ""}`.trim();

  const qrUrl = `https://img.vietqr.io/image/MB-${bankAccount}-compact2.png?amount=${selectedTier}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleCopySTK = () => {
    navigator.clipboard.writeText(bankAccount);
    setCopiedSTK(true);
    setTimeout(() => setCopiedSTK(false), 2000);
  };

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterMessage.trim()) return;

    // Save to supporter messages in localStorage
    try {
      const stored = localStorage.getItem("memcard_donations") || "[]";
      const list = JSON.parse(stored);
      list.unshift({
        name: supporterName.trim() || "Người bạn ẩn danh",
        message: supporterMessage.trim(),
        amount: selectedTier,
        date: new Date().toLocaleDateString("vi-VN")
      });
      localStorage.setItem("memcard_donations", JSON.stringify(list));
    } catch {}

    setSentThankYou(true);
  };

  return (
    <MyModal
      title="Ủng hộ tác giả (Buy Me a Coffee) ☕"
      onClose={onClose}
      maxWidth="540px"
    >
      <Container>
        <HeroBanner>
          <MemCardLogo size={52} showText={false} />
          <div className="text">
            <h4>Cảm ơn bạn đã đồng hành cùng MemCard!</h4>
            <p>
              Mỗi tách cà phê là một nguồn động lực to lớn giúp tác giả duy trì máy chủ, nghiên cứu thêm nhiều tính năng học tập thông minh và giữ ứng dụng 100% miễn phí cho cộng đồng.
            </p>
          </div>
        </HeroBanner>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 700 }}>
            Chọn số lượng cà phê muốn mời:
          </label>
          <CoffeeOptionRow>
            <CoffeeCard
              $selected={selectedTier === 20000}
              onClick={() => setSelectedTier(20000)}
            >
              <span className="icon">☕</span>
              <span className="label">1 Ly Cà phê</span>
              <span className="amount">20.000đ</span>
            </CoffeeCard>

            <CoffeeCard
              $selected={selectedTier === 50000}
              onClick={() => setSelectedTier(50000)}
            >
              <span className="icon">☕☕</span>
              <span className="label">2 Ly Cà phê</span>
              <span className="amount">50.000đ</span>
            </CoffeeCard>

            <CoffeeCard
              $selected={selectedTier === 100000}
              onClick={() => setSelectedTier(100000)}
            >
              <span className="icon">🍰☕</span>
              <span className="label">Bánh & Cà phê</span>
              <span className="amount">100.000đ</span>
            </CoffeeCard>
          </CoffeeOptionRow>
        </div>

        <BankInfoCard>
          <div className="qr-section">
            <img src={qrUrl} alt="Mã VietQR ủng hộ" />
            <div className="bank-details">
              <div className="row">
                <span className="label">Ngân hàng:</span>
                <span className="val">{bankName}</span>
              </div>
              <div className="row">
                <span className="label">Số tài khoản:</span>
                <span className="val">
                  {bankAccount}
                  <button
                    onClick={handleCopySTK}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }}
                    title="Sao chép số tài khoản"
                  >
                    {copiedSTK ? <MdCheck color="#10b981" /> : <MdContentCopy />}
                  </button>
                </span>
              </div>
              <div className="row">
                <span className="label">Chủ tài khoản:</span>
                <span className="val">{accountHolder}</span>
              </div>
              <div className="row">
                <span className="label">Số tiền:</span>
                <span className="val" style={{ color: "#ea580c" }}>{selectedTier.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="row">
                <span className="label">Nội dung:</span>
                <span className="val" style={{ fontSize: "12px" }}>{transferContent}</span>
              </div>
            </div>
          </div>
        </BankInfoCard>

        {sentThankYou ? (
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "14px"
            }}
          >
            💖 Cảm ơn lời chúc ngọt ngào của bạn! Chúc bạn học từ vựng thật tiến bộ và ghi nhớ siêu lâu!
          </div>
        ) : (
          <form onSubmit={handleSendWish} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: 700 }}>
              Gửi lời nhắn / Lời chúc tới tác giả:
            </label>
            <MyInput
              placeholder="Tên của bạn hoặc biệt danh..."
              value={supporterName}
              onChange={(e) => setSupporterName(e.target.value)}
            />
            <MyTextarea
              style={{ minHeight: "65px" }}
              placeholder="VD: Cảm ơn tác giả nhiều nha, ứng dụng học từ vựng rất hay!..."
              value={supporterMessage}
              onChange={(e) => setSupporterMessage(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <MyButton variant="ghost" size="sm" onClick={onClose}>
                Để sau
              </MyButton>
              <MyButton
                variant="primary"
                size="sm"
                icon={<MdFavorite color="#f43f5e" />}
                type="submit"
                disabled={!supporterMessage.trim()}
              >
                Gửi lời chúc
              </MyButton>
            </div>
          </form>
        )}
      </Container>
    </MyModal>
  );
}
