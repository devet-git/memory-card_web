import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { User } from "firebase/auth";
import {
  MdCloudUpload,
  MdCloudDownload,
  MdCheckCircle,
  MdErrorOutline,
  MdOutlineSync
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  syncToGoogleDrive,
  restoreFromGoogleDrive,
  getCurrentUser
} from "utils/googleDrive";
import useCollectionContext from "contexts/Collection";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoBox = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  background-color: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: var(--text-primary, #0f172a);
  font-size: 13px;
  line-height: 1.5;
`;

const UserProfileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg-tertiary, #f1f5f9);
  border: 1px solid var(--border-color, #e2e8f0);

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .details {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 700;
        font-size: 14px;
        color: var(--text-primary, #0f172a);
      }

      .email {
        font-size: 12px;
        color: var(--text-secondary, #64748b);
      }
    }
  }
`;

const ActionCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  gap: 14px;

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary, #64748b);
    }
  }
`;

const GoogleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: #ffffff;
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: #f9fafb;
    border-color: #94a3b8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  svg {
    font-size: 20px;
  }
`;

const StatusMessage = styled.div<{ $type: "success" | "error" | "info" }>`
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  ${(props) => {
    switch (props.$type) {
      case "success":
        return `
          background-color: rgba(16, 185, 129, 0.12);
          color: #059669;
        `;
      case "error":
        return `
          background-color: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        `;
      default:
        return `
          background-color: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        `;
    }
  }}
`;

interface GoogleDriveModalProps {
  onClose: () => void;
}

export default function GoogleDriveModal({ onClose }: GoogleDriveModalProps) {
  const { exportToJSON, importFromJSON } = useCollectionContext();
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("memcard_gdrive_last_sync") || null;
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setStatusMsg({ text: `Đã kết nối thành công với tài khoản ${result.user.displayName || result.user.email}!`, type: "success" });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Đăng nhập thất bại: ${err?.message || "Vui lòng thử lại"}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setStatusMsg({ text: "Đã ngắt kết nối Google Drive.", type: "info" });
  };

  const handleBackupToDrive = async () => {
    if (!user) return;
    setIsLoading(true);
    setStatusMsg({ text: "Đang tải dữ liệu lên Google Drive...", type: "info" });
    try {
      const jsonStr = exportToJSON();
      const res = await syncToGoogleDrive(jsonStr);
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
        setLastSyncTime(timeNow);
        localStorage.setItem("memcard_gdrive_last_sync", timeNow);
        setStatusMsg({
          text: `Đã đồng bộ toàn bộ bộ thẻ lên Google Drive an toàn!`,
          type: "success"
        });
      } else {
        setStatusMsg({ text: `Lỗi đồng bộ: ${res.error}`, type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Lỗi: ${err?.message}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!user) return;

    // MANDATORY Confirmation dialog before restoring/mutating user data
    const confirmed = window.confirm(
      "Bạn có chắc muốn khôi phục dữ liệu từ Google Drive? Dữ liệu trên trình duyệt sẽ được cập nhật đồng bộ theo bản lưu trên Drive."
    );
    if (!confirmed) return;

    setIsLoading(true);
    setStatusMsg({ text: "Đang tải bản lưu từ Google Drive về máy...", type: "info" });
    try {
      const res = await restoreFromGoogleDrive();
      if (res.success && res.data) {
        const importResult = importFromJSON(JSON.stringify(res.data));
        if (importResult.success) {
          setStatusMsg({
            text: `Thành công! Đã khôi phục ${importResult.count} bộ sưu tập từ Google Drive!`,
            type: "success"
          });
        } else {
          setStatusMsg({ text: `Lỗi đọc dữ liệu: ${importResult.error}`, type: "error" });
        }
      } else {
        setStatusMsg({ text: `Khôi phục thất bại: ${res.error}`, type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Lỗi: ${err?.message}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MyModal
      title="Đồng bộ Google Drive (Cloud Sync)"
      onClose={onClose}
      maxWidth="560px"
    >
      <Container>
        <InfoBox>
          ☁️ <strong>Lưu trữ đám mây tự động:</strong> Dữ liệu từ vựng và tiến trình học tập của bạn sẽ được lưu thành tệp tin riêng tư <code>memcard_backup.json</code> trên Google Drive cá nhân, giúp bạn học tiếp trên điện thoại, máy tính bảng hoặc máy tính khác dễ dàng.
        </InfoBox>

        {statusMsg && (
          <StatusMessage $type={statusMsg.type}>
            {statusMsg.type === "success" && <MdCheckCircle size={18} />}
            {statusMsg.type === "error" && <MdErrorOutline size={18} />}
            {statusMsg.type === "info" && <MdOutlineSync size={18} />}
            <span>{statusMsg.text}</span>
          </StatusMessage>
        )}

        {!user ? (
          <div>
            <GoogleButton onClick={handleSignIn} disabled={isLoading}>
              <FcGoogle />
              <span>{isLoading ? "Đang kết nối..." : "Đăng nhập với Google Drive"}</span>
            </GoogleButton>
          </div>
        ) : (
          <>
            <UserProfileCard>
              <div className="user-info">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700
                    }}
                  >
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="details">
                  <span className="name">{user.displayName || "Người dùng Google"}</span>
                  <span className="email">{user.email}</span>
                </div>
              </div>

              <MyButton
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
              >
                Đăng xuất
              </MyButton>
            </UserProfileCard>

            {lastSyncTime && (
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                Lần đồng bộ gần nhất: <strong>{lastSyncTime}</strong>
              </div>
            )}

            <ActionCard>
              <div className="card-content">
                <h4>
                  <MdCloudUpload color="#3b82f6" size={18} />
                  Sao lưu lên Google Drive
                </h4>
                <p>Tải toàn bộ bộ sưu tập hiện tại lên lưu trữ Google Drive của bạn.</p>
              </div>
              <MyButton
                variant="primary"
                size="sm"
                icon={<MdCloudUpload />}
                onClick={handleBackupToDrive}
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Đồng bộ ngay"}
              </MyButton>
            </ActionCard>

            <ActionCard>
              <div className="card-content">
                <h4>
                  <MdCloudDownload color="#10b981" size={18} />
                  Khôi phục từ Google Drive
                </h4>
                <p>Lấy bản sao lưu từ Google Drive về trình duyệt thiết bị này.</p>
              </div>
              <MyButton
                variant="secondary"
                size="sm"
                icon={<MdCloudDownload />}
                onClick={handleRestoreFromDrive}
                disabled={isLoading}
              >
                Khôi phục
              </MyButton>
            </ActionCard>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <MyButton variant="ghost" onClick={onClose}>
            Đóng
          </MyButton>
        </div>
      </Container>
    </MyModal>
  );
}
