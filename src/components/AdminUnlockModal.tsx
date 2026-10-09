import React, { useState } from "react";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import { MyInput } from "./MyInput";
import { adminLogin, LoginResult } from "utils/admin";

interface Props {
  onClose: () => void;
  onUnlocked: () => void;
}

const MESSAGES: Record<Exclude<LoginResult, "ok">, string> = {
  wrong: "Sai mật khẩu.",
  locked: "Thử sai quá nhiều lần. Hãy đợi một phút.",
  not_configured: "Máy chủ chưa có biến môi trường ADMIN_PASSWORD. Xem docs/ADMIN.md.",
  unavailable: "Không kết nối được máy chủ cấu hình. Chức năng này chỉ chạy khi deploy trên Vercel (hoặc `npx vercel dev`)."
};

export default function AdminUnlockModal({ onClose, onUnlocked }: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    const result = await adminLogin(password);
    setBusy(false);
    if (result === "ok") return onUnlocked();
    setError(MESSAGES[result]);
    setPassword("");
  };

  return (
    <MyModal
      title="Quản trị"
      onClose={onClose}
      maxWidth="400px"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <MyButton variant="ghost" onClick={onClose}>
            Hủy
          </MyButton>
          <MyButton variant="primary" type="submit" form="admin-unlock-form" disabled={!password || busy}>
            {busy ? "Đang kiểm tra..." : "Đăng nhập"}
          </MyButton>
        </div>
      }
    >
      <form id="admin-unlock-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <MyInput type="password" autoFocus autoComplete="off" placeholder="Mật khẩu quản trị" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Mật khẩu quản trị" />
        {error && (
          <span role="alert" style={{ color: "#dc2626", fontSize: 13 }}>
            {error}
          </span>
        )}
      </form>
    </MyModal>
  );
}
