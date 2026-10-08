import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineHelpOutline,
  MdOutlineFileDownload,
  MdOutlineFileUpload,
  MdOutlineRestartAlt,
  MdVolumeUp,
  MdOutlineApps,
  MdCloudQueue
} from "react-icons/md";
import { IoFlashOutline, IoFolderOpenOutline, IoCafeOutline } from "react-icons/io5";
import { HiFire } from "react-icons/hi";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import MyModal from "components/MyModal";
import { speakWord } from "utils/speech";
import { MyInput } from "components/MyInput";
import MemCardLogo from "components/MemCardLogo";
import DonateModal from "components/DonateModal";
import GoogleDriveModal from "components/GoogleDriveModal";

interface MainLayoutProps {
  children: React.ReactNode;
}

const AppWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary, #f8fafc);
  color: var(--text-primary, #0f172a);
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  backdrop-filter: blur(10px);
  padding: 0 20px;
`;

const NavContainer = styled.div`
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: var(--text-primary, #0f172a);

  .logo-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  }

  .logo-text {
    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$active ? "#2563eb" : "var(--text-secondary, #475569)")};
  background-color: ${(props) => (props.$active ? "rgba(37, 99, 235, 0.08)" : "transparent")};
  transition: all 0.15s ease;

  &:hover {
    color: #2563eb;
    background-color: rgba(37, 99, 235, 0.08);
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StreakBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%);
  color: #d97706;
  font-weight: 700;
  font-size: 13px;

  svg {
    color: #ea580c;
    font-size: 17px;
  }
`;

const MainContent = styled.main`
  flex: 1;
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 60px 28px;

  @media (max-width: 640px) {
    padding: 16px 14px 60px 14px;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-secondary, #ffffff);
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted, #94a3b8);
`;

const ShortcutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--border-color, #e2e8f0);

    .key {
      display: inline-block;
      padding: 3px 8px;
      font-size: 12px;
      font-family: monospace;
      font-weight: 700;
      background-color: var(--bg-tertiary, #f1f5f9);
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
`;

const BackupArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .section {
    padding: 14px;
    border-radius: 10px;
    background-color: var(--bg-tertiary, #f1f5f9);
    display: flex;
    flex-direction: column;
    gap: 8px;

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary, #64748b);
    }
  }
`;

export default function MainLayout({ children }: MainLayoutProps): JSX.Element {
  const location = useLocation();
  const {
    settings,
    updateSettings,
    toggleTheme,
    stats,
    collections,
    exportToJSON,
    importFromJSON,
    resetToDefaultData
  } = useCollectionContext();

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [testSpeechText, setTestSpeechText] = useState("Hello, welcome to Memory Card!");
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleExportFile = () => {
    const jsonStr = exportToJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memcard-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importFromJSON(content);
        if (result.success) {
          setImportMessage(`Thành công! Đã nạp ${result.count} bộ sưu tập.`);
        } else {
          setImportMessage(`Thất bại: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <AppWrapper>
      <Header>
        <NavContainer>
          <BrandArea>
            <LogoLink to="/" title="MemCard - Trang chủ">
              <MemCardLogo size={36} />
            </LogoLink>

            <NavLinks>
              <NavItem to="/" $active={location.pathname === "/"}>
                Trang chủ
              </NavItem>
              <NavItem
                to="/collections"
                $active={location.pathname.startsWith("/collections")}
              >
                <IoFolderOpenOutline />
                Bộ sưu tập ({collections.length})
              </NavItem>
              <NavItem
                to="/apps"
                $active={location.pathname.startsWith("/apps")}
              >
                <MdOutlineApps />
                Ứng dụng liên quan
              </NavItem>
            </NavLinks>
          </BrandArea>

          <RightControls>
            <StreakBadge title="Chuỗi ngày ôn tập liên tục của bạn">
              <HiFire />
              <span>{stats.studyStreakDays} ngày</span>
            </StreakBadge>

            <MyButton
              variant="outline"
              size="sm"
              icon={<MdCloudQueue color="#3b82f6" />}
              onClick={() => setShowGoogleDriveModal(true)}
              title="Đồng bộ đám mây Google Drive"
            >
              Google Drive
            </MyButton>

            <MyButton
              variant="primary"
              size="sm"
              icon={<IoCafeOutline />}
              onClick={() => setShowDonateModal(true)}
              title="Ủng hộ tác giả một tách cà phê (Buy Me a Coffee)"
            >
              Mời cà phê ☕
            </MyButton>

            <MyButton
              variant="ghost"
              size="sm"
              icon={<MdVolumeUp />}
              onClick={() => setShowVoiceModal(true)}
              title="Cài đặt phát âm Text to Speech (Miễn phí)"
            >
              Giọng đọc
            </MyButton>

            <MyButton
              variant="ghost"
              size="sm"
              icon={settings.theme === "dark" ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
              onClick={toggleTheme}
              title={settings.theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
            />

            <MyButton
              variant="ghost"
              size="sm"
              icon={<MdOutlineFileUpload />}
              onClick={() => setShowBackupModal(true)}
              title="Sao lưu & Phục hồi dữ liệu trên trình duyệt"
            >
              Sao lưu
            </MyButton>

            <MyButton
              variant="ghost"
              size="sm"
              icon={<MdOutlineHelpOutline />}
              onClick={() => setShowShortcutsModal(true)}
              title="Phím tắt khi học"
            />
          </RightControls>
        </NavContainer>
      </Header>

      <MainContent>{children}</MainContent>

      <Footer>
        <p>
          MEMOCARD • Ứng dụng học từ vựng Flashcard ghi nhớ nhanh • Toàn bộ dữ liệu được lưu an toàn trực tiếp trên trình duyệt của bạn (Offline-ready)
        </p>
      </Footer>

      {/* SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <MyModal
          title="Bảng phím tắt học nhanh"
          onClose={() => setShowShortcutsModal(false)}
        >
          <ShortcutList>
            <div className="item">
              <span>Lật thẻ (Mặt trước / Mặt sau)</span>
              <span className="key">Space / Enter</span>
            </div>
            <div className="item">
              <span>Chuyển sang thẻ tiếp theo</span>
              <span className="key">→ (Phím mũi tên phải) hoặc J</span>
            </div>
            <div className="item">
              <span>Quay lại thẻ trước đó</span>
              <span className="key">← (Phím mũi tên trái) hoặc K</span>
            </div>
            <div className="item">
              <span>Phát âm giọng đọc Text-to-Speech</span>
              <span className="key">R</span>
            </div>
            <div className="item">
              <span>Đánh dấu: Cần ôn lại (Chưa nhớ)</span>
              <span className="key">1</span>
            </div>
            <div className="item">
              <span>Đánh dấu: Đang học</span>
              <span className="key">2</span>
            </div>
            <div className="item">
              <span>Đánh dấu: Đã thuộc làu</span>
              <span className="key">3</span>
            </div>
            <div className="item">
              <span>Yêu thích / Bỏ thích (Star)</span>
              <span className="key">S</span>
            </div>
          </ShortcutList>
        </MyModal>
      )}

      {/* BACKUP & RESTORE MODAL */}
      {showBackupModal && (
        <MyModal
          title="Quản lý dữ liệu trên trình duyệt"
          onClose={() => {
            setShowBackupModal(false);
            setImportMessage(null);
          }}
        >
          <BackupArea>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Dữ liệu của bạn được lưu an toàn tự động trong LocalStorage của trình duyệt. Bạn có thể xuất tệp JSON để chuyển sang máy tính khác hoặc lưu làm bản sao dự phòng bất cứ lúc nào.
            </p>

            {importMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: importMessage.includes("Thành công") ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: importMessage.includes("Thành công") ? "#059669" : "#dc2626",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {importMessage}
              </div>
            )}

            <div className="section">
              <h4>1. Xuất dữ liệu ra máy (Backup JSON)</h4>
              <p>Tải toàn bộ bộ sưu tập và lịch sử học tập về dạng tệp tin .json</p>
              <div>
                <MyButton
                  variant="primary"
                  size="sm"
                  icon={<MdOutlineFileDownload />}
                  onClick={handleExportFile}
                >
                  Tải tệp sao lưu (.json)
                </MyButton>
              </div>
            </div>

            <div className="section">
              <h4>2. Nhập dữ liệu từ tệp tin (Restore JSON)</h4>
              <p>Khôi phục các bộ thẻ đã lưu từ tệp tin json trước đây.</p>
              <label>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleImportFile}
                />
                <MyButton
                  variant="secondary"
                  size="sm"
                  icon={<MdOutlineFileUpload />}
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector("input");
                    input?.click();
                  }}
                >
                  Chọn tệp JSON để nạp vào
                </MyButton>
              </label>
            </div>

            <div className="section" style={{ border: "1px dashed #ef4444" }}>
              <h4 style={{ color: "#ef4444" }}>3. Đặt lại dữ liệu gốc (Reset to Defaults)</h4>
              <p>Khôi phục lại toàn bộ dữ liệu mẫu mặc định ban đầu.</p>
              <div>
                <MyButton
                  variant="danger"
                  size="sm"
                  icon={<MdOutlineRestartAlt />}
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu về mặc định?")) {
                      resetToDefaultData();
                      setImportMessage("Đã khôi phục dữ liệu mẫu ban đầu thành công!");
                    }
                  }}
                >
                  Khôi phục dữ liệu mẫu
                </MyButton>
              </div>
            </div>
          </BackupArea>
        </MyModal>
      )}

      {/* VOICE & TTS SETTINGS MODAL */}
      {showVoiceModal && (
        <MyModal
          title="Dịch vụ Text to Speech (Miễn phí 100%)"
          onClose={() => setShowVoiceModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.1)",
                color: "#1d4ed8",
                fontSize: "13px",
                lineHeight: "1.5"
              }}
            >
              🎉 <strong>Hoàn toàn miễn phí & Không giới hạn:</strong> Ứng dụng tích hợp công nghệ kép kết hợp <strong>Web Speech API</strong> (chạy trực tiếp trên trình duyệt, không cần mạng, độ trễ 0ms) và <strong>Luồng âm thanh từ điển quốc tế</strong> dự phòng.
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Tốc độ phát âm (Speed Rate)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { label: "0.75x (Chậm)", val: 0.75 },
                  { label: "0.95x (Tự nhiên)", val: 0.95 },
                  { label: "1.15x (Nhanh)", val: 1.15 }
                ].map((item) => (
                  <MyButton
                    key={item.val}
                    variant={settings.speechRate === item.val ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      updateSettings({ speechRate: item.val });
                    }}
                  >
                    {item.label}
                  </MyButton>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Thử nghiệm phát âm trực tiếp
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <MyInput
                  value={testSpeechText}
                  onChange={(e) => setTestSpeechText(e.target.value)}
                  placeholder="Nhập từ hoặc câu cần nghe thử..."
                />
                <MyButton
                  variant="primary"
                  icon={<MdVolumeUp />}
                  onClick={() => speakWord(testSpeechText, undefined, settings.speechRate)}
                  title="Phát âm thử"
                >
                  Phát âm
                </MyButton>
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <MyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTestSpeechText("Asynchronous programming in JavaScript");
                    speakWord("Asynchronous programming in JavaScript", "en-US", settings.speechRate);
                  }}
                >
                  Thử: Tiếng Anh
                </MyButton>
                <MyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTestSpeechText("Xin chào! Chúc bạn học từ vựng hiệu quả.");
                    speakWord("Xin chào! Chúc bạn học từ vựng hiệu quả.", "vi-VN", settings.speechRate);
                  }}
                >
                  Thử: Tiếng Việt
                </MyButton>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <MyButton variant="primary" onClick={() => setShowVoiceModal(false)}>
                Đã hiểu & Đóng
              </MyButton>
            </div>
          </div>
        </MyModal>
      )}
    </AppWrapper>
  );
}
