import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  MdContentCopy,
  MdCheck,
  MdFavorite,
  MdSettings,
  MdOutlineQrCodeScanner,
  MdOutlineFileDownload
} from "react-icons/md";
import { IoCafeOutline, IoHeart } from "react-icons/io5";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import { MyInput, MyTextarea } from "./MyInput";
import MemCardLogo from "./MemCardLogo";

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

const SupporterWall = styled.div`
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 4px;

  .item {
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--bg-card, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    font-size: 12.5px;

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;

      .name {
        font-weight: 700;
        color: #b45309;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .amount {
        font-size: 11px;
        font-weight: 600;
        color: #ea580c;
        background: rgba(234, 88, 12, 0.1);
        padding: 1px 6px;
        border-radius: 9999px;
      }
    }

    .msg {
      color: var(--text-secondary, #475569);
      font-style: italic;
    }
  }
`;

interface SupporterItem {
  name: string;
  message: string;
  amount: number;
  date: string;
}

interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

const DEFAULT_BANK: BankConfig = {
  bankId: "MB",
  bankName: "MB Bank (Quân Đội)",
  accountNo: "0335888999",
  accountName: "DEVET / MEMCARD"
};

const SAMPLE_SUPPORTERS: SupporterItem[] = [
  { name: "Minh Tuấn (IELTS 7.5)", message: "Cảm ơn bạn, app học từ vựng nhẹ và tiện quá!", amount: 50000, date: "Hôm nay" },
  { name: "Lan Anh", message: "Giao diện xinh xắn, lật thẻ rất mượt!", amount: 20000, date: "Hôm qua" },
  { name: "Một người ẩn danh", message: "Mời bạn ly cà phê sáng nhiều năng lượng code nhé! ☕", amount: 100000, date: "3 ngày trước" }
];

interface DonateModalProps {
  onClose: () => void;
}

export default function DonateModal({ onClose }: DonateModalProps) {
  const [selectedTier, setSelectedTier] = useState<number>(20000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Supporter Form
  const [supporterName, setSupporterName] = useState("");
  const [supporterMessage, setSupporterMessage] = useState("");
  const [sentThankYou, setSentThankYou] = useState(false);
  const [supporters, setSupporters] = useState<SupporterItem[]>([]);

  // Config settings
  const [showConfig, setShowConfig] = useState(false);
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => {
    try {
      const saved = localStorage.getItem("memcard_bank_config");
      return saved ? JSON.parse(saved) : DEFAULT_BANK;
    } catch {
      return DEFAULT_BANK;
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("memcard_donations");
      if (stored) {
        setSupporters(JSON.parse(stored));
      } else {
        setSupporters(SAMPLE_SUPPORTERS);
      }
    } catch {
      setSupporters(SAMPLE_SUPPORTERS);
    }
  }, []);

  const activeAmount = isCustom ? Number(customAmount) || 20000 : selectedTier;
  const transferContent = `Ung ho MemCard ${supporterName ? supporterName.trim() : ""}`.trim();

  // VietQR Quick Link
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${activeAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("memcard_bank_config", JSON.stringify(bankConfig));
    setShowConfig(false);
  };

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterMessage.trim()) return;

    const newItem: SupporterItem = {
      name: supporterName.trim() || "Người bạn ẩn danh",
      message: supporterMessage.trim(),
      amount: activeAmount,
      date: "Vừa xong"
    };

    const updated = [newItem, ...supporters];
    setSupporters(updated);
    try {
      localStorage.setItem("memcard_donations", JSON.stringify(updated));
    } catch {}

    setSentThankYou(true);
  };

  return (
    <MyModal
      title="Ủng hộ tác giả (Buy Me a Coffee) ☕"
      onClose={onClose}
      maxWidth="560px"
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
            <button
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}
              title="Cài đặt thông tin nhận chuyển khoản"
            >
              <MdSettings /> {showConfig ? "Đóng cài đặt" : "Cấu hình STK"}
            </button>
          </div>

          {showConfig && (
            <form onSubmit={handleSaveBankConfig} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                ⚙️ Cấu hình thông tin nhận ủng hộ của chủ website:
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <MyInput
                  placeholder="Mã Ngân hàng (VD: MB, VCB, TCB...)"
                  value={bankConfig.bankId}
                  onChange={(e) => setBankConfig({ ...bankConfig, bankId: e.target.value.toUpperCase() })}
                />
                <MyInput
                  placeholder="Số tài khoản"
                  value={bankConfig.accountNo}
                  onChange={(e) => setBankConfig({ ...bankConfig, accountNo: e.target.value })}
                />
              </div>
              <MyInput
                placeholder="Tên chủ tài khoản"
                value={bankConfig.accountName}
                onChange={(e) => setBankConfig({ ...bankConfig, accountName: e.target.value })}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <MyButton size="sm" variant="ghost" onClick={() => setShowConfig(false)}>Hủy</MyButton>
                <MyButton size="sm" variant="primary" type="submit">Lưu thông tin</MyButton>
              </div>
            </form>
          )}

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

        {/* SEND A WISH OR VIEW SUPPORTER WALL */}
        {sentThankYou ? (
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "13.5px"
            }}
          >
            💖 Cảm ơn lời chúc tuyệt vời của bạn! Chúc bạn học từ vựng thật tiến bộ và ghi nhớ siêu tốc!
          </div>
        ) : (
          <form onSubmit={handleSendWish} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Gửi lời nhắn / Lời chúc tới tác giả:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <MyInput
                placeholder="Tên của bạn hoặc nickname..."
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
              />
              <MyInput
                placeholder="Lời chúc (VD: Cảm ơn app học rất hay!)..."
                value={supporterMessage}
                onChange={(e) => setSupporterMessage(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {supporters.length} lời chúc từ cộng đồng
              </span>
              <MyButton
                variant="primary"
                size="sm"
                icon={<IoHeart color="#f43f5e" />}
                type="submit"
                disabled={!supporterMessage.trim()}
              >
                Gửi lời chúc
              </MyButton>
            </div>
          </form>
        )}

        {/* SUPPORTER WALL */}
        {supporters.length > 0 && (
          <div>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
              🌟 Lời chúc gần đây từ người học:
            </label>
            <SupporterWall>
              {supporters.map((item, index) => (
                <div className="item" key={index}>
                  <div className="top">
                    <span className="name">
                      <span>☕</span> {item.name}
                    </span>
                    <span className="amount">+{item.amount.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="msg">"{item.message}"</div>
                </div>
              ))}
            </SupporterWall>
          </div>
        )}
      </Container>
    </MyModal>
  );
}
