import React, { useState, useSyncExternalStore } from "react";
import styled from "styled-components";
import {
  MdCloudUpload,
  MdCloudDownload,
  MdCheckCircle,
  MdErrorOutline,
  MdOutlineSync,
  MdSwapHoriz
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import CloseFooter from "components/CloseFooter";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import {
  AuthError,
  Profile,
  signIn,
  signOut,
  readProfile,
  getValidToken,
  subscribeAuth,
  getAuthVersion,
  getClientId,
  clientIdSource,
  setCustomClientId,
  looksLikeClientId
} from "utils/googleAuth";
import { DriveError } from "utils/googleDrive";
import { overwriteRemote, fetchRemote } from "utils/driveSync";
import { googleDeps, runSync, unblockSync, driveMeta } from "utils/driveRunner";
import { useDriveDeps } from "hooks/useAutoSync";
import { useSyncStatus, formatSyncTime } from "utils/syncStatus";
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
  gap: 10px;

  @media (max-width: 480px) {
    padding: 12px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .details {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .name {
        font-weight: 700;
        font-size: 14px;
        color: var(--text-primary, #0f172a);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .email {
        font-size: 12px;
        color: var(--text-secondary, #64748b);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    padding: 14px;
    gap: 12px;

    button {
      width: 100%;
    }
  }

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

const Steps = styled.ol`
  margin: 6px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
`;

const Details = styled.details`
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 10px 14px;

  summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
  }
  code {
    background: var(--bg-tertiary, #f1f5f9);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
    word-break: break-all;
  }
  .block {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
  }
`;

const explain = (err: unknown): string => {
  if (err instanceof AuthError) {
    if (err.code === "denied") return `${err.message} Nếu ứng dụng Google đang ở chế độ “Testing”, hãy thêm email của bạn vào mục Test users hoặc chuyển sang “In production”.`;
    return err.message;
  }
  if (err instanceof DriveError) return err.message;
  return (err as Error)?.message || "Đã xảy ra lỗi.";
};

export default function GoogleDriveModal({ onClose }: GoogleDriveModalProps) {
  const { exportLatest, importFromJSON, settings, updateSettings } = useCollectionContext();
  const deps = useDriveDeps();
  useSyncExternalStore(subscribeAuth, getAuthVersion); // re-render when the Google session changes
  const profile: Profile | null = readProfile();
  const sync = useSyncStatus();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [clientInput, setClientInput] = useState(clientIdSource() === "custom" ? getClientId() : "");

  const fail = (err: unknown) => setMsg({ text: explain(err), type: "error" });

  /** A valid token, signing in first when needed. Called straight from a click so the Google popup is allowed. */
  const ensureSignedIn = async (): Promise<boolean> => {
    if (getValidToken()) return true;
    await signIn();
    unblockSync();
    return true;
  };

  const handleSignIn = async (opts: { chooseAccount?: boolean; forceConsent?: boolean } = {}) => {
    setBusy(true);
    setMsg(null);
    try {
      const p = await signIn(opts);
      unblockSync();
      setMsg({ text: `Đã kết nối với tài khoản ${p.email || p.name}.`, type: "success" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMsg({ text: "Đã ngắt kết nối Google Drive. Dữ liệu trên máy và trên Drive vẫn được giữ nguyên.", type: "info" });
  };

  const handleSyncNow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await ensureSignedIn();
      unblockSync();
      const result = await runSync(deps);
      if (result) setMsg({ text: "Đồng bộ hoàn tất.", type: "success" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const handleOverwriteDrive = async () => {
    if (!window.confirm("Ghi đè bản sao lưu trên Google Drive bằng dữ liệu của máy này? Thay đổi chỉ có trên Drive (từ thiết bị khác) sẽ bị mất.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await ensureSignedIn();
      await overwriteRemote({ ...googleDeps, exportLocal: exportLatest });
      setMsg({ text: "Đã ghi đè Drive bằng dữ liệu của máy này.", type: "success" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceLocal = async () => {
    if (!window.confirm("Thay thế TOÀN BỘ dữ liệu trên máy này bằng bản trên Google Drive? Thay đổi chỉ có trên máy này sẽ bị mất.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await ensureSignedIn();
      const remote = await fetchRemote(googleDeps);
      const res = importFromJSON(remote.text);
      if (!res.success) throw new Error(`Không đọc được bản sao lưu: ${res.error}`);
      driveMeta.set({ ...driveMeta.get(), remoteModified: remote.modifiedTime });
      setMsg({ text: `Đã khôi phục ${res.count} bộ sưu tập từ Google Drive.`, type: "success" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const saveClientId = () => {
    const id = clientInput.trim();
    if (id && !looksLikeClientId(id)) {
      setMsg({ text: "Client ID không đúng định dạng. Nó có dạng 123456789-abcdef.apps.googleusercontent.com.", type: "error" });
      return;
    }
    setCustomClientId(id || null);
    setMsg({ text: id ? "Đã lưu Client ID. Hãy đăng nhập lại bằng Client ID mới." : "Đã quay về Client ID mặc định.", type: "info" });
  };

  const status = (() => {
    if (sync.state === "syncing") return { text: "Đang đồng bộ...", type: "info" as const };
    if (sync.state === "needs-auth") return { text: sync.message || "Cần kết nối lại Google.", type: "error" as const };
    if (sync.state === "error") return { text: sync.message || "Đồng bộ thất bại.", type: "error" as const };
    return null;
  })();

  return (
    <MyModal title="Đồng bộ Google Drive (Cloud Sync)" onClose={onClose} maxWidth="560px" footer={<CloseFooter onClose={onClose} />}>
      <Container>
        <InfoBox>
          ☁️ <strong>Lưu trữ đám mây:</strong> dữ liệu của bạn được lưu thành tệp <code>memcard_backup.json</code> trong Google Drive cá nhân. MemCard chỉ thấy tệp do chính nó tạo, không đọc được các tệp khác. Dữ liệu đi thẳng từ trình duyệt tới Google, không qua máy chủ nào khác.
        </InfoBox>

        {msg && (
          <StatusMessage $type={msg.type} role="status">
            {msg.type === "success" && <MdCheckCircle size={18} />}
            {msg.type === "error" && <MdErrorOutline size={18} />}
            {msg.type === "info" && <MdOutlineSync size={18} />}
            <span>{msg.text}</span>
          </StatusMessage>
        )}

        {!profile ? (
          <div>
            <GoogleButton onClick={() => handleSignIn()} disabled={busy}>
              <FcGoogle />
              <span>{busy ? "Đang kết nối..." : "Đăng nhập với Google"}</span>
            </GoogleButton>
          </div>
        ) : (
          <>
            <UserProfileCard>
              <div className="user-info">
                {profile.picture ? (
                  <img src={profile.picture} alt={profile.name} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {(profile.name || profile.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="details">
                  <span className="name">{profile.name}</span>
                  <span className="email">{profile.email}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <MyButton variant="ghost" size="sm" onClick={() => handleSignIn({ chooseAccount: true })} disabled={busy} title="Đăng nhập bằng tài khoản Google khác">
                  Đổi
                </MyButton>
                <MyButton variant="ghost" size="sm" onClick={handleSignOut} disabled={busy}>
                  Đăng xuất
                </MyButton>
              </div>
            </UserProfileCard>

            {status && (
              <StatusMessage $type={status.type} role="status">
                {status.type === "error" ? <MdErrorOutline size={18} /> : <MdOutlineSync size={18} />}
                <span style={{ flex: 1 }}>{status.text}</span>
                {sync.state === "needs-auth" && (
                  <MyButton variant="primary" size="sm" onClick={() => handleSignIn()} disabled={busy}>
                    Kết nối lại
                  </MyButton>
                )}
              </StatusMessage>
            )}

            {sync.lastSync && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
                Lần đồng bộ gần nhất: <strong>{formatSyncTime(sync.lastSync)}</strong>
                {sync.state === "synced" && sync.detail ? ` — ${sync.detail}` : ""}
              </div>
            )}

            <ActionCard>
              <div className="card-content">
                <h4>
                  <MdSwapHoriz color="#3b82f6" size={20} />
                  Đồng bộ ngay
                </h4>
                <p>Gộp bản trên Drive với dữ liệu máy này rồi lưu lại. An toàn: không ghi đè và không làm mất thẻ ở bất kỳ bên nào.</p>
              </div>
              <MyButton variant="primary" size="sm" icon={<MdOutlineSync />} onClick={handleSyncNow} disabled={busy || sync.state === "syncing"}>
                {busy || sync.state === "syncing" ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </MyButton>
            </ActionCard>

            <ActionCard>
              <div className="card-content">
                <h4>Tự động đồng bộ</h4>
                <p>Tự đồng bộ sau mỗi thay đổi, và kiểm tra thay đổi từ thiết bị khác khi bạn quay lại ứng dụng.</p>
              </div>
              <MyButton variant={settings.autoSync ? "success" : "secondary"} size="sm" onClick={() => updateSettings({ autoSync: !settings.autoSync })}>
                {settings.autoSync ? "Đang bật" : "Đang tắt"}
              </MyButton>
            </ActionCard>

            <Details>
              <summary>Tùy chọn nâng cao</summary>
              <div className="block">
                <ActionCard>
                  <div className="card-content">
                    <h4>
                      <MdCloudUpload color="#f59e0b" size={18} />
                      Ghi đè Drive bằng dữ liệu máy này
                    </h4>
                    <p>Dùng khi bản trên Drive bị hỏng hoặc bạn muốn bắt đầu lại từ máy này.</p>
                  </div>
                  <MyButton variant="secondary" size="sm" onClick={handleOverwriteDrive} disabled={busy}>
                    Ghi đè Drive
                  </MyButton>
                </ActionCard>
                <ActionCard>
                  <div className="card-content">
                    <h4>
                      <MdCloudDownload color="#ef4444" size={18} />
                      Thay thế dữ liệu máy bằng bản trên Drive
                    </h4>
                    <p>Dữ liệu trên máy này sẽ bị thay bằng bản trên Drive.</p>
                  </div>
                  <MyButton variant="secondary" size="sm" onClick={handleReplaceLocal} disabled={busy}>
                    Thay thế
                  </MyButton>
                </ActionCard>
              </div>
            </Details>
          </>
        )}

        <Details>
          <summary>Hướng dẫn cài đặt và khắc phục sự cố</summary>
          <div className="block">
            <div>
              Địa chỉ ứng dụng hiện tại: <code>{window.location.origin}</code>
              <br />
              Client ID đang dùng: <code>{getClientId()}</code> ({{ custom: "do bạn nhập", env: "từ biến môi trường", default: "mặc định" }[clientIdSource()]})
            </div>
            <strong>Dùng Google Cloud của riêng bạn (khuyên dùng):</strong>
            <Steps>
              <li>
                Vào <code>console.cloud.google.com</code>, tạo (hoặc chọn) một dự án.
              </li>
              <li>
                <em>APIs &amp; Services → Library</em>: bật <strong>Google Drive API</strong>.
              </li>
              <li>
                <em>OAuth consent screen</em>: loại External, điền tên ứng dụng và email, thêm scope <code>drive.file</code>, rồi bấm <strong>Publish app</strong> (scope này không cần Google duyệt).
              </li>
              <li>
                <em>Credentials → Create credentials → OAuth client ID</em>, loại <strong>Web application</strong>; ở <em>Authorized JavaScript origins</em> thêm đúng địa chỉ <code>{window.location.origin}</code>.
              </li>
              <li>Sao chép Client ID, dán vào ô bên dưới rồi lưu, sau đó đăng nhập lại.</li>
            </Steps>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                aria-label="Google OAuth Client ID"
                style={{ flex: 1, minWidth: 200, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit" }}
              />
              <MyButton variant="secondary" size="sm" onClick={saveClientId}>
                {clientInput.trim() ? "Lưu" : "Dùng mặc định"}
              </MyButton>
            </div>
            <strong>Lỗi thường gặp:</strong>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>
                <code>origin_mismatch</code>: địa chỉ ở trên chưa nằm trong Authorized JavaScript origins.
              </li>
              <li>
                <code>access_denied</code> hoặc “app not verified”: ứng dụng đang ở chế độ Testing, hãy Publish hoặc thêm email vào Test users.
              </li>
              <li>“Google Drive API chưa được bật”: làm bước 2.</li>
              <li>Không thấy cửa sổ đăng nhập: cho phép popup cho trang này.</li>
              <li>“Chưa cấp quyền Drive”: đăng nhập lại và tích ô cho phép truy cập Drive.</li>
            </ul>
            <span style={{ color: "var(--text-secondary)" }}>Hướng dẫn đầy đủ có trong tệp docs/GOOGLE_DRIVE_SETUP.md của dự án.</span>
          </div>
        </Details>
      </Container>
    </MyModal>
  );
}
