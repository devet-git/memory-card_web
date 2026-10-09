import React, { useState } from "react";
import styled from "styled-components";
import { MdAdd, MdArrowDownward, MdArrowUpward, MdDelete } from "react-icons/md";
import MyModal from "./MyModal";
import MyButton from "./MyButton";
import { MyInput } from "./MyInput";
import SearchSelect from "./SearchSelect";
import { lockAdmin } from "utils/admin";
import { DonateConfig, SiteConfigError, effectiveApps, effectiveDonate, saveSiteConfig, useSiteConfigState } from "utils/siteConfig";
import { RelatedApp, defaultApps } from "data/relatedApps";
import { BANKS, findBank } from "data/vietnamBanks";

export type AdminTab = "donate" | "apps" | "system";

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: 1px solid var(--border-color, #cbd5e1);
  background: ${(p) => (p.$active ? "var(--primary, #3b82f6)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "inherit")};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const AppRow = styled.div`
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Note = styled.p`
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-secondary);
`;

interface Props {
  initialTab?: AdminTab;
  onClose: () => void;
}

export default function AdminConsoleModal({ initialTab = "donate", onClose }: Props) {
  const { config, storage, adminConfigured } = useSiteConfigState();
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [donate, setDonate] = useState<DonateConfig>(() => ({ ...effectiveDonate(config), enabled: config?.donate?.enabled !== false }));
  const [apps, setApps] = useState<RelatedApp[]>(() => effectiveApps(config).map((a) => ({ ...a })));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const patchApp = (i: number, patch: Partial<RelatedApp>) => setApps((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const moveApp = (i: number, d: number) =>
    setApps((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveSiteConfig({ donate, apps });
      setMsg({ text: "Đã lưu. Mọi người sẽ thấy thay đổi trong vòng ít phút (bộ nhớ đệm 15–60 giây).", ok: true });
    } catch (err) {
      setMsg({ text: err instanceof SiteConfigError ? err.message : "Lưu thất bại.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MyModal
      title="Quản trị MemCard"
      onClose={onClose}
      maxWidth="640px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", flexWrap: "wrap" }}>
          <span role="status" style={{ fontSize: 13, alignSelf: "center", color: msg ? (msg.ok ? "#059669" : "#dc2626") : "var(--text-secondary)" }}>
            {msg ? msg.text : "Thay đổi áp dụng cho mọi người sau khi lưu."}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <MyButton variant="ghost" onClick={onClose}>
              Đóng
            </MyButton>
            {tab !== "system" && (
              <MyButton variant="primary" onClick={save} disabled={busy}>
                {busy ? "Đang lưu..." : "Lưu cho mọi người"}
              </MyButton>
            )}
          </div>
        </div>
      }
    >
      <Tabs role="tablist">
        {([
          ["donate", "Ủng hộ"],
          ["apps", "Ứng dụng liên quan"],
          ["system", "Hệ thống"]
        ] as [AdminTab, string][]).map(([id, label]) => (
          <TabButton key={id} role="tab" aria-selected={tab === id} $active={tab === id} onClick={() => setTab(id)}>
            {label}
          </TabButton>
        ))}
      </Tabs>

      {storage !== "edge-config" && tab !== "system" && (
        <Note style={{ color: "#b45309", marginBottom: 10 }}>
          {storage === "none" ? "Máy chủ chưa có nơi lưu cấu hình (Vercel Edge Config), nên chưa lưu được. Xem tab Hệ thống." : "Chưa kết nối được nơi lưu cấu hình. Xem tab Hệ thống."}
        </Note>
      )}

      {tab === "donate" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={donate.enabled} onChange={(e) => setDonate({ ...donate, enabled: e.target.checked })} />
            Hiện mục “Mời cà phê” cho người dùng
          </label>
          <Field as="div">
            Ngân hàng
            <SearchSelect
              creatable
              value={findBank(donate.bankId)?.bin ?? donate.bankId}
              onChange={(v) => {
                const bank = findBank(v);
                setDonate({ ...donate, bankId: bank ? bank.bin : v.trim().toUpperCase(), bankName: bank ? bank.name : donate.bankName });
              }}
              options={BANKS.map((b) => ({ value: b.bin, label: `${b.code} - ${b.name}` }))}
              placeholder="Chọn ngân hàng..."
              searchPlaceholder="Tìm theo tên hoặc mã (VD: vietcombank, MB)..."
              emptyText="Không có trong danh sách. Gõ mã ngân hàng VietQR để dùng."
              ariaLabel="Ngân hàng"
            />
            <span style={{ fontWeight: 400 }}>
              Mã VietQR: <code>{donate.bankId || "(chưa chọn)"}</code>
            </span>
          </Field>
          <Grid>
            <Field>
              Tên ngân hàng hiển thị
              <MyInput value={donate.bankName} onChange={(e) => setDonate({ ...donate, bankName: e.target.value })} />
            </Field>
            <Field>
              Số tài khoản
              <MyInput inputMode="numeric" value={donate.accountNo} onChange={(e) => setDonate({ ...donate, accountNo: e.target.value })} />
            </Field>
          </Grid>
          <Field>
            Tên chủ tài khoản
            <MyInput value={donate.accountName} onChange={(e) => setDonate({ ...donate, accountName: e.target.value })} />
          </Field>
          <Note>Thông tin này hiện công khai trên mã QR của mọi người dùng.</Note>
        </div>
      )}

      {tab === "apps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {apps.map((a, i) => (
            <AppRow key={a.id + i}>
              <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 8 }}>
                <MyInput aria-label="Biểu tượng" value={a.icon} onChange={(e) => patchApp(i, { icon: e.target.value })} />
                <MyInput aria-label="Tên ứng dụng" placeholder="Tên" value={a.name} onChange={(e) => patchApp(i, { name: e.target.value })} />
              </div>
              <Grid>
                <MyInput aria-label="Địa chỉ" placeholder="https://..." value={a.url} onChange={(e) => patchApp(i, { url: e.target.value })} />
                <MyInput aria-label="Nhóm" placeholder="Nhóm" value={a.category} onChange={(e) => patchApp(i, { category: e.target.value })} />
              </Grid>
              <MyInput aria-label="Mô tả" placeholder="Mô tả ngắn" value={a.description} onChange={(e) => patchApp(i, { description: e.target.value })} />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <MyButton variant="ghost" size="sm" icon={<MdArrowUpward />} onClick={() => moveApp(i, -1)} disabled={i === 0} title="Lên" />
                <MyButton variant="ghost" size="sm" icon={<MdArrowDownward />} onClick={() => moveApp(i, 1)} disabled={i === apps.length - 1} title="Xuống" />
                <MyButton variant="ghost" size="sm" icon={<MdDelete />} onClick={() => setApps((prev) => prev.filter((_, j) => j !== i))} title="Xoá" />
              </div>
            </AppRow>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <MyButton variant="secondary" size="sm" icon={<MdAdd />} disabled={apps.length >= 30} onClick={() => setApps((prev) => [...prev, { id: `app-${Date.now()}`, name: "", url: "https://", icon: "🔗", category: "Công cụ", description: "" }])}>
              Thêm ứng dụng
            </MyButton>
            <MyButton variant="ghost" size="sm" onClick={() => window.confirm("Đặt lại danh sách về mặc định (chưa lưu cho tới khi bấm “Lưu cho mọi người”)?") && setApps(defaultApps.map((a) => ({ ...a })))}>
              Đặt lại mặc định
            </MyButton>
          </div>
          <Note>Tối đa 30 ứng dụng. Mỗi mục cần có tên và địa chỉ http(s). Tổng dung lượng cấu hình giới hạn khoảng 7KB (Edge Config bản miễn phí).</Note>
        </div>
      )}

      {tab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, lineHeight: 1.6 }}>
          <div>
            Nơi lưu cấu hình:{" "}
            <strong>{storage === "edge-config" ? "Vercel Edge Config (sẵn sàng)" : storage === "none" ? "chưa thiết lập" : storage === "error" ? "lỗi đọc" : "không có máy chủ"}</strong>
          </div>
          <div>
            ADMIN_PASSWORD trên máy chủ: <strong>{adminConfigured ? "đã đặt" : "chưa đặt"}</strong>
          </div>
          {storage !== "edge-config" && (
            <Note>
              Để lưu được: tạo một Edge Config trên Vercel (Storage), nối vào project (tự tạo biến <code>EDGE_CONFIG</code> hoặc <code>GLOBAL_CONFIG</code>), tạo API token rồi đặt <code>VERCEL_API_TOKEN</code> (và <code>VERCEL_TEAM_ID</code> nếu project thuộc team), sau đó Redeploy. Chi tiết trong docs/ADMIN.md.
            </Note>
          )}
          <Note>
            Phím tắt mở màn hình này: <strong>Alt + Shift + A</strong> (trên điện thoại: bấm logo 7 lần). Google Client ID đặt bằng biến môi trường <code>GOOGLE_CLIENT_ID</code>, không chỉnh trên giao diện.
          </Note>
          <div>
            <MyButton
              variant="secondary"
              onClick={() => {
                lockAdmin();
                onClose();
              }}
            >
              Thoát chế độ quản trị
            </MyButton>
          </div>
        </div>
      )}
    </MyModal>
  );
}
