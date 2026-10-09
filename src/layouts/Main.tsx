import React, { useState, useRef, useEffect } from "react";
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
  MdCloudQueue,
  MdMoreHoriz,
  MdOutlineDashboardCustomize,
  MdOutlineInsights,
  MdSportsEsports,
  MdOutlineSettings,
  MdSearch
} from "react-icons/md";
import { IoFolderOpenOutline, IoCafeOutline, IoHomeOutline, IoFlashOutline } from "react-icons/io5";
import { HiFire } from "react-icons/hi";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import MyModal from "components/MyModal";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { MyInput } from "components/MyInput";
import MemCardLogo from "components/MemCardLogo";
import DonateModal from "components/DonateModal";
import GoogleDriveModal from "components/GoogleDriveModal";
import { downloadTextFile, backupFileName } from "utils/download";
import { isDue } from "utils/srs";
import { levelInfo, xpOf } from "utils/xp";
import CloseFooter from "components/CloseFooter";
import StudySettingsModal from "components/StudySettingsModal";
import GlobalSearch from "components/GlobalSearch";
import useAutoSync from "hooks/useAutoSync";
import useReminder from "hooks/useReminder";

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

// Pages with their own sticky bar (collections, words, apps) scroll the header away
// so the two sticky layers don't eat the content area.
const Header = styled.header<{ $sticky: boolean }>`
  position: ${(props) => (props.$sticky ? "sticky" : "relative")};
  top: 0;
  z-index: 1000;
  background-color: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  backdrop-filter: blur(10px);
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 12px;
  }
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

  @media (max-height: 820px) {
    height: 52px;
  }

  @media (max-width: 768px) {
    height: 56px;
    gap: 8px;
  }
`;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: var(--text-primary, #0f172a);
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
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

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

const DesktopOnlyControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileOnlyControls = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 6px;
  }
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
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 12px;
    gap: 3px;
  }

  svg {
    color: #ea580c;
    font-size: 17px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 15px;
    }
  }
`;

// Same pill as the streak, hidden on narrow screens where the header is already full
const LevelChip = styled(StreakBadge)`
  @media (max-width: 480px) {
    display: none;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 6px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: dropdownAnim 0.16s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes dropdownAnim {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-primary, #0f172a);
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--bg-tertiary, #f1f5f9);
    color: var(--accent-primary, #2563eb);
  }

  .icon {
    font-size: 19px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #64748b);
    flex-shrink: 0;
  }

  &:hover .icon {
    color: var(--accent-primary, #2563eb);
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: var(--border-color, #e2e8f0);
  margin: 4px 6px;
`;

const MainContent = styled.main`
  flex: 1;
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px 60px 28px;

  @media (max-height: 820px) {
    padding-top: 12px;
    padding-bottom: 36px;
  }

  @media (max-width: 768px) {
    padding: 10px 10px calc(72px + env(safe-area-inset-bottom, 0px)) 10px;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-secondary, #ffffff);
  padding: 14px 20px;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-muted, #94a3b8);

  @media (max-width: 768px) {
    padding: 16px 12px calc(76px + env(safe-area-inset-bottom, 0px)) 12px;
    font-size: 12px;
  }
`;

/* MOBILE BOTTOM NAVIGATION BAR */
const BottomNavBar = styled.nav`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(58px + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--bg-secondary, #ffffff);
    border-top: 1px solid var(--border-color, #e2e8f0);
    backdrop-filter: blur(14px);
    z-index: 1000;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -3px 15px rgba(0, 0, 0, 0.05);
  }
`;

const BottomNavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  height: 100%;
  color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "var(--text-muted, #94a3b8)")};
  font-size: 11px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  text-decoration: none;
  transition: all 0.15s ease;
  user-select: none;

  svg {
    font-size: 20px;
    color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "inherit")};
  }
`;

const BottomNavButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  height: 100%;
  color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "var(--text-muted, #94a3b8)")};
  font-size: 11px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  background: transparent;
  border: none;
  transition: all 0.15s ease;
  user-select: none;
  cursor: pointer;

  svg {
    font-size: 20px;
    color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "inherit")};
  }
`;

const UtilitiesMenuGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const UtilityCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  text-align: left;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover, &:active {
    background: var(--bg-tertiary, #f1f5f9);
    border-color: var(--accent-primary, #3b82f6);
    transform: translateY(-1px);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary, #0f172a);

    svg {
      font-size: 20px;
      flex-shrink: 0;
    }
  }

  .desc {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
    line-height: 1.35;
  }
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

  const { speak, isLoading: isSpeakLoading } = useSpeak();
  const dueCount = collections.reduce((acc, c) => acc + c.words.filter((w) => isDue(w)).length, 0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [showStudySettings, setShowStudySettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Ctrl/Cmd+K opens card search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useAutoSync();
  useReminder();
  const [showMobileMenuModal, setShowMobileMenuModal] = useState(false);
  const [showUtilitiesDropdown, setShowUtilitiesDropdown] = useState(false);
  const [testSpeechText, setTestSpeechText] = useState("Hello, welcome to MemCard!");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUtilitiesDropdown(false);
      }
    };
    if (showUtilitiesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUtilitiesDropdown]);

  const handleExportFile = () => {
    const jsonStr = exportToJSON();
    downloadTextFile(jsonStr, backupFileName());
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
      <Header $sticky={location.pathname === "/"}>
        <NavContainer>
          <BrandArea>
            <LogoLink to="/" title="MemCard - Về trang chủ">
              <MemCardLogo size={32} />
            </LogoLink>

            <NavLinks>
              <NavItem
                to="/collections"
                $active={location.pathname.startsWith("/collections")}
              >
                <IoFolderOpenOutline />
                Bộ sưu tập ({collections.length})
              </NavItem>
              <NavItem to="/review" $active={location.pathname.startsWith("/review")}>
                <IoFlashOutline />
                Ôn tập{dueCount > 0 ? ` (${dueCount})` : ""}
              </NavItem>
              <NavItem to="/stats" $active={location.pathname.startsWith("/stats")}>
                <MdOutlineInsights />
                Thống kê
              </NavItem>
              <NavItem to="/games" $active={location.pathname.startsWith("/games")}>
                <MdSportsEsports />
                Trò chơi
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
            <MyButton
              variant="ghost"
              size="sm"
              icon={<MdSearch />}
              onClick={() => setShowSearch(true)}
              title="Tìm thẻ (Ctrl+K)"
            />

            <StreakBadge title={`Chuỗi ngày ôn tập liên tục của bạn • ${stats.freezes ?? 0} băng streak 🧊`}>
              <HiFire />
              <span>{stats.studyStreakDays} ngày</span>
            </StreakBadge>
            <LevelChip as={Link} to="/stats" title={`${levelInfo(xpOf(stats)).title} • ${xpOf(stats)} XP`} style={{ textDecoration: "none" }}>
              <span>Lv {levelInfo(xpOf(stats)).level}</span>
            </LevelChip>

            {/* DESKTOP CONTROLS */}
            <DesktopOnlyControls>
              <MyButton
                variant="ghost"
                size="sm"
                icon={settings.theme === "dark" ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
                onClick={toggleTheme}
                title={settings.theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
              />

              <DropdownContainer ref={dropdownRef}>
                <MyButton
                  variant={showUtilitiesDropdown ? "secondary" : "ghost"}
                  size="sm"
                  icon={<MdOutlineDashboardCustomize />}
                  onClick={() => setShowUtilitiesDropdown(!showUtilitiesDropdown)}
                  title="Tiện ích & Cài đặt nâng cao"
                >
                  Tiện ích
                </MyButton>

                {showUtilitiesDropdown && (
                  <DropdownMenu>
                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowStudySettings(true);
                      }}
                    >
                      <span className="icon"><MdOutlineSettings color="#f59e0b" /></span>
                      <span>Cài đặt học tập</span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowGoogleDriveModal(true);
                      }}
                    >
                      <span className="icon"><MdCloudQueue color="#3b82f6" /></span>
                      <span>Google Drive</span>
                    </DropdownItem>

                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowDonateModal(true);
                      }}
                    >
                      <span className="icon"><IoCafeOutline color="#ea580c" /></span>
                      <span>Mời cà phê ☕</span>
                    </DropdownItem>

                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowVoiceModal(true);
                      }}
                    >
                      <span className="icon"><MdVolumeUp color="#8b5cf6" /></span>
                      <span>Giọng đọc (TTS)</span>
                    </DropdownItem>

                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowBackupModal(true);
                      }}
                    >
                      <span className="icon"><MdOutlineFileUpload color="#10b981" /></span>
                      <span>Sao lưu JSON</span>
                    </DropdownItem>

                    <DropdownDivider />

                    <DropdownItem
                      onClick={() => {
                        setShowUtilitiesDropdown(false);
                        setShowShortcutsModal(true);
                      }}
                    >
                      <span className="icon"><MdOutlineHelpOutline color="#6366f1" /></span>
                      <span>Phím tắt học</span>
                    </DropdownItem>
                  </DropdownMenu>
                )}
              </DropdownContainer>
            </DesktopOnlyControls>

            {/* MOBILE ONLY CONTROLS */}
            <MobileOnlyControls>
              <MyButton
                variant="ghost"
                size="sm"
                icon={settings.theme === "dark" ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
                onClick={toggleTheme}
                title={settings.theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
              />

              <MyButton
                variant="secondary"
                size="sm"
                icon={<MdMoreHoriz />}
                onClick={() => setShowMobileMenuModal(true)}
                title="Tiện ích & Cài đặt"
              />
            </MobileOnlyControls>
          </RightControls>
        </NavContainer>
      </Header>

      <MainContent>{children}</MainContent>

      <Footer>
        <p>
          MemCard • Ứng dụng học từ vựng Flashcard ghi nhớ nhanh • Toàn bộ dữ liệu được lưu an toàn trực tiếp trên trình duyệt của bạn (Offline-ready)
        </p>
      </Footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNavBar>
        <BottomNavItem to="/" $active={location.pathname === "/"}>
          <IoHomeOutline />
          <span>Trang chủ</span>
        </BottomNavItem>

        <BottomNavItem
          to="/collections"
          $active={location.pathname.startsWith("/collections")}
        >
          <IoFolderOpenOutline />
          <span>Bộ thẻ ({collections.length})</span>
        </BottomNavItem>

        <BottomNavItem to="/review" $active={location.pathname.startsWith("/review")}>
          <IoFlashOutline />
          <span>Ôn tập{dueCount > 0 ? ` (${dueCount})` : ""}</span>
        </BottomNavItem>

        <BottomNavItem to="/stats" $active={location.pathname.startsWith("/stats")}>
          <MdOutlineInsights />
          <span>Thống kê</span>
        </BottomNavItem>

        <BottomNavButton
          onClick={() => setShowMobileMenuModal(true)}
          $active={showMobileMenuModal}
        >
          <MdOutlineDashboardCustomize />
          <span>Tiện ích</span>
        </BottomNavButton>
      </BottomNavBar>

      {/* MOBILE UTILITIES SHEET / MODAL */}
      {showMobileMenuModal && (
        <MyModal
          title="Tiện ích & Cài đặt nâng cao"
          onClose={() => setShowMobileMenuModal(false)}
          footer={<CloseFooter onClose={() => setShowMobileMenuModal(false)} />}
        >
          <UtilitiesMenuGrid>
            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowStudySettings(true);
              }}
            >
              <div className="header">
                <MdOutlineSettings color="#f59e0b" />
                <span>Cài đặt học tập</span>
              </div>
              <div className="desc">Mục tiêu, nhắc học, tự đồng bộ, cài app</div>
            </UtilityCard>

            <UtilityCard as={Link} to="/games" onClick={() => setShowMobileMenuModal(false)}>
              <div className="header">
                <MdSportsEsports color="#ec4899" />
                <span>Trò chơi</span>
              </div>
              <div className="desc">Đoán chữ, đúng/sai, lật thẻ và thử thách hằng ngày</div>
            </UtilityCard>

            <UtilityCard as={Link} to="/apps" onClick={() => setShowMobileMenuModal(false)}>
              <div className="header">
                <MdOutlineApps color="#0ea5e9" />
                <span>Ứng dụng liên quan</span>
              </div>
              <div className="desc">Hệ sinh thái các ứng dụng của tác giả</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowGoogleDriveModal(true);
              }}
            >
              <div className="header">
                <MdCloudQueue color="#3b82f6" />
                <span>Google Drive</span>
              </div>
              <div className="desc">Đồng bộ đám mây dữ liệu thẻ cá nhân</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowDonateModal(true);
              }}
            >
              <div className="header">
                <IoCafeOutline color="#ea580c" />
                <span>Mời cà phê ☕</span>
              </div>
              <div className="desc">Ủng hộ tác giả duy trì dự án miễn phí</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowVoiceModal(true);
              }}
            >
              <div className="header">
                <MdVolumeUp color="#8b5cf6" />
                <span>Giọng đọc TTS</span>
              </div>
              <div className="desc">Cài đặt tốc độ và thử giọng phát âm</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowBackupModal(true);
              }}
            >
              <div className="header">
                <MdOutlineFileUpload color="#10b981" />
                <span>Sao lưu JSON</span>
              </div>
              <div className="desc">Xuất & nhập tệp dữ liệu máy tính</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                setShowMobileMenuModal(false);
                setShowShortcutsModal(true);
              }}
            >
              <div className="header">
                <MdOutlineHelpOutline color="#6366f1" />
                <span>Phím tắt học</span>
              </div>
              <div className="desc">Xem bảng phím tắt thao tác nhanh</div>
            </UtilityCard>

            <UtilityCard
              onClick={() => {
                toggleTheme();
                setShowMobileMenuModal(false);
              }}
            >
              <div className="header">
                {settings.theme === "dark" ? <MdOutlineLightMode color="#f59e0b" /> : <MdOutlineDarkMode color="#475569" />}
                <span>{settings.theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</span>
              </div>
              <div className="desc">Chuyển đổi màu sắc sáng / ban đêm</div>
            </UtilityCard>
          </UtilitiesMenuGrid>
        </MyModal>
      )}

      {/* SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <MyModal
          title="Bảng phím tắt học nhanh"
          onClose={() => setShowShortcutsModal(false)}
          footer={<CloseFooter onClose={() => setShowShortcutsModal(false)} />}
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
          footer={
            <CloseFooter
              onClose={() => {
                setShowBackupModal(false);
                setImportMessage(null);
              }}
            />
          }
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
          footer={<CloseFooter onClose={() => setShowVoiceModal(false)} label="Đã hiểu & Đóng" />}
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
                  icon={isSpeakLoading("test") ? <SpeakSpinner /> : <MdVolumeUp />}
                  onClick={() => speak("test", testSpeechText, undefined, settings.speechRate)}
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
                    speak("test-en", "Asynchronous programming in JavaScript", "en-US", settings.speechRate);
                  }}
                >
                  Thử: Tiếng Anh
                </MyButton>
                <MyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTestSpeechText("Xin chào! Chúc bạn học từ vựng hiệu quả.");
                    speak("test-vi", "Xin chào! Chúc bạn học từ vựng hiệu quả.", "vi-VN", settings.speechRate);
                  }}
                >
                  Thử: Tiếng Việt
                </MyButton>
              </div>
            </div>

          </div>
        </MyModal>
      )}

      {/* DONATE / BUY ME A COFFEE MODAL */}
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}

      {/* GOOGLE DRIVE MODAL */}
      {showGoogleDriveModal && <GoogleDriveModal onClose={() => setShowGoogleDriveModal(false)} />}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
      {showStudySettings && (
        <StudySettingsModal
          onClose={() => setShowStudySettings(false)}
          onOpenDrive={() => {
            setShowStudySettings(false);
            setShowGoogleDriveModal(true);
          }}
        />
      )}
    </AppWrapper>
  );
}
