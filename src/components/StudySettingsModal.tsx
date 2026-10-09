import React, { useState } from "react";
import MyModal from "components/MyModal";
import CloseFooter from "components/CloseFooter";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import useCollectionContext from "contexts/Collection";
import useInstallPrompt from "hooks/useInstallPrompt";
import { notificationsSupported } from "hooks/useReminder";
import { getAccessToken } from "utils/googleDrive";
import AISettingsModal from "components/AISettingsModal";
import useAIConfig from "hooks/useAIConfig";
import { AI_PROVIDERS } from "utils/ai";
import { clampRetention } from "utils/fsrs";

interface Props {
  onClose: () => void;
  onOpenDrive: () => void;
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 14, borderBottom: "1px dashed var(--border-color, #e2e8f0)" }}>
    {children}
  </div>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", lineHeight: 1.45 }}>{children}</span>
);

export default function StudySettingsModal({ onClose, onOpenDrive }: Props) {
  const { settings, updateSettings } = useCollectionContext();
  const { canInstall, installed, install } = useInstallPrompt();
  const [message, setMessage] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const aiConfig = useAIConfig();

  const permission = notificationsSupported() ? Notification.permission : "denied";

  const toggleReminder = async () => {
    if (settings.reminderEnabled) {
      updateSettings({ reminderEnabled: false });
      return;
    }
    if (!notificationsSupported()) {
      setMessage("Trình duyệt này không hỗ trợ thông báo.");
      return;
    }
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (result === "granted") {
      updateSettings({ reminderEnabled: true });
      setMessage(null);
    } else {
      setMessage("Bạn chưa cấp quyền thông báo cho trang web này.");
    }
  };

  const toggleAutoSync = async () => {
    if (settings.autoSync) {
      updateSettings({ autoSync: false });
      return;
    }
    if (!(await getAccessToken())) {
      setMessage("Hãy đăng nhập Google Drive trước, rồi bật tự động đồng bộ.");
      onOpenDrive();
      return;
    }
    updateSettings({ autoSync: true });
    setMessage(null);
  };

  return (
    <MyModal title="Cài đặt học tập" onClose={onClose} maxWidth="520px" footer={<CloseFooter onClose={onClose} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {message && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245, 158, 11, 0.15)", color: "#b45309", fontSize: 13 }}>
            {message}
          </div>
        )}

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Mục tiêu mỗi ngày (số thẻ)</label>
          <MyInput
            type="number"
            min={1}
            max={500}
            value={settings.dailyGoal ?? 20}
            onChange={(e) => updateSettings({ dailyGoal: Math.min(500, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Thuật toán lên lịch ôn tập</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <MyButton variant={settings.scheduler !== "fsrs" ? "primary" : "secondary"} size="sm" onClick={() => updateSettings({ scheduler: "sm2" })}>
              SM-2 (đơn giản)
            </MyButton>
            <MyButton variant={settings.scheduler === "fsrs" ? "primary" : "secondary"} size="sm" onClick={() => updateSettings({ scheduler: "fsrs" })}>
              FSRS (thông minh)
            </MyButton>
          </div>
          {settings.scheduler === "fsrs" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="retention" style={{ fontSize: 13 }}>
                Độ nhớ mục tiêu
              </label>
              <select
                id="retention"
                value={String(Math.round(clampRetention(settings.desiredRetention) * 100))}
                onChange={(e) => updateSettings({ desiredRetention: Number(e.target.value) / 100 })}
                style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit" }}
              >
                {[80, 85, 90, 95].map((v) => (
                  <option key={v} value={v}>
                    {v}%{v === 90 ? " (khuyên dùng)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Hint>
            {settings.scheduler === "fsrs"
              ? "FSRS theo dõi độ ổn định và độ khó của từng thẻ rồi chọn ngày ôn để bạn còn nhớ đúng mức mục tiêu: nhớ cao hơn thì ôn dày hơn, thấp hơn thì ít lượt ôn hơn. Thẻ đã ôn theo SM-2 được chuyển sang tự động từ khoảng cách hiện tại, không mất tiến độ."
              : "SM-2 nhân khoảng cách ôn theo hệ số dễ của từng thẻ. Đổi sang FSRS để lịch ôn thích nghi với trí nhớ của bạn; có thể quay lại bất cứ lúc nào, tiến độ vẫn được giữ."}
          </Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Tự đọc từ khi hiện thẻ</label>
          <div>
            <MyButton variant={settings.autoSpeak ? "success" : "secondary"} size="sm" onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}>
              {settings.autoSpeak ? "Đang bật" : "Đang tắt"}
            </MyButton>
          </div>
          <Hint>Phát âm mặt trước của thẻ ngay khi thẻ xuất hiện (flashcard và ôn tập hôm nay).</Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Ôn ngược thẻ đã thuộc</label>
          <div>
            <MyButton variant={settings.reverseReview !== false ? "success" : "secondary"} size="sm" onClick={() => updateSettings({ reverseReview: settings.reverseReview === false })}>
              {settings.reverseReview !== false ? "Đang bật" : "Đang tắt"}
            </MyButton>
          </div>
          <Hint>Thỉnh thoảng hỏi ngược (nhìn nghĩa, nhớ lại từ) với thẻ bạn đã nhớ từ 7 ngày trở lên, để nhớ chắc cả hai chiều. Lịch ôn vẫn tính chung cho thẻ.</Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Nhắc học hằng ngày</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <MyButton variant={settings.reminderEnabled ? "success" : "secondary"} size="sm" onClick={toggleReminder}>
              {settings.reminderEnabled ? "Đang bật" : "Đang tắt"}
            </MyButton>
            <input
              type="time"
              value={settings.reminderTime || "20:00"}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              disabled={!settings.reminderEnabled}
              style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit" }}
            />
          </div>
          <Hint>
            Thông báo chỉ hiện khi MemCard đang mở (hoặc đã cài và đang chạy nền) và bạn chưa đạt mục tiêu trong ngày.
            {permission === "denied" && " Quyền thông báo đang bị chặn trong cài đặt trình duyệt."}
          </Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Tự động đồng bộ Google Drive</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <MyButton variant={settings.autoSync ? "success" : "secondary"} size="sm" onClick={toggleAutoSync}>
              {settings.autoSync ? "Đang bật" : "Đang tắt"}
            </MyButton>
            <MyButton variant="ghost" size="sm" onClick={onOpenDrive}>
              Mở Google Drive
            </MyButton>
          </div>
          <Hint>
            Khi bật, dữ liệu được gộp với bản trên Drive lúc mở app (không ghi đè) và tự tải lên sau mỗi lần thay đổi. Phiên đăng nhập Google
            Drive hết hạn sau khoảng 1 giờ, khi đó cần đăng nhập lại. Thẻ đã xóa ở một thiết bị có thể xuất hiện lại do cơ chế gộp.
          </Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Trợ lý AI (API key của bạn)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <MyButton variant={aiConfig ? "success" : "secondary"} size="sm" onClick={() => setShowAISettings(true)}>
              {aiConfig ? `Đã kết nối: ${AI_PROVIDERS[aiConfig.provider].label}` : "Thêm API key"}
            </MyButton>
          </div>
          <Hint>Dùng để tạo thẻ từ chủ đề, gợi ý nghĩa/ví dụ/mẹo nhớ và chấm câu bạn đặt. Key chỉ lưu trong trình duyệt này.</Hint>
        </Row>

        <Row>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Từ điển offline</label>
          <Hint>
            Gợi ý từ, phiên âm, định nghĩa tiếng Anh và nghĩa tiếng Việt cho ~43.000 từ, không cần mạng hay AI. Dữ liệu từ WordNet
            (Princeton), CMU Pronouncing Dictionary, FrequencyWords và Wiktionary qua Kaikki.org (CC BY-SA 4.0) — chi tiết tại <a href={`${process.env.PUBLIC_URL || ""}/dict/LICENSES.txt`} target="_blank" rel="noopener noreferrer">LICENSES.txt</a>.
          </Hint>
        </Row>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Cài MemCard như ứng dụng</label>
          {installed ? (
            <Hint>Đã cài đặt MemCard trên thiết bị này.</Hint>
          ) : canInstall ? (
            <div>
              <MyButton variant="primary" size="sm" onClick={install}>
                Cài đặt ứng dụng
              </MyButton>
            </div>
          ) : (
            <Hint>
              Dùng menu của trình duyệt (Chia sẻ → "Thêm vào Màn hình chính" trên iOS, hoặc biểu tượng cài đặt trên thanh địa chỉ ở Chrome/Edge) để cài
              MemCard và học offline.
            </Hint>
          )}
        </div>
      </div>
      {showAISettings && <AISettingsModal onClose={() => setShowAISettings(false)} />}
    </MyModal>
  );
}
