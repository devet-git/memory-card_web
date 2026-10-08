import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineHelpOutline,
  MdOutlineFileDownload,
  MdOutlineFileUpload,
  MdOutlineRestartAlt
} from "react-icons/md";
import { IoFlashOutline, IoFolderOpenOutline } from "react-icons/io5";
import { HiFire } from "react-icons/hi";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import MyModal from "components/MyModal";

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
  max-width: 1160px;
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

const NavItem = styled(Link)<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.active ? "#2563eb" : "var(--text-secondary, #475569)")};
  background-color: ${(props) => (props.active ? "rgba(37, 99, 235, 0.08)" : "transparent")};
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
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 60px 20px;
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
    toggleTheme,
    stats,
    collections,
    exportToJSON,
    importFromJSON,
    resetToDefaultData
  } = useCollectionContext();

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleExportFile = () => {
    const jsonStr = exportToJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memocard-backup-${new Date().toISOString().split("T")[0]}.json`;
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
            <LogoLink to="/">
              <div className="logo-icon">
                <IoFlashOutline />
              </div>
              <span className="logo-text">MEMOCARD</span>
            </LogoLink>

            <NavLinks>
              <NavItem to="/" active={location.pathname === "/"}>
                Trang chủ
              </NavItem>
              <NavItem
                to="/collections"
                active={location.pathname.startsWith("/collections")}
              >
                <IoFolderOpenOutline />
                Bộ sưu tập ({collections.length})
              </NavItem>
            </NavLinks>
          </BrandArea>

          <RightControls>
            <StreakBadge title="Chuỗi ngày ôn tập liên tục của bạn">
              <HiFire />
              <span>{stats.studyStreakDays} ngày</span>
            </StreakBadge>

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
    </AppWrapper>
  );
}
