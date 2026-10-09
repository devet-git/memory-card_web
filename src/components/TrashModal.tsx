import React, { useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import CloseFooter from "components/CloseFooter";
import useCollectionContext from "contexts/Collection";
import { TRASH_DAYS, daysLeft } from "utils/trash";
import { firstMeaning } from "utils/games";

import { confirmDialog } from "utils/dialogs";
/** Recently deleted cards and decks, with a way to bring them back. */
export default function TrashModal({ onClose }: { onClose: () => void }) {
  const { trash, restoreFromTrash, removeFromTrash, emptyTrash } = useCollectionContext();
  const [message, setMessage] = useState<string | null>(null);

  const restore = (id: string, label: string) => {
    const r = restoreFromTrash(id);
    setMessage(r.ok ? `Đã khôi phục “${label}”.` : r.error || "Không khôi phục được.");
  };

  const decks = trash.filter((e) => e.kind === "deck");
  const words = trash.filter((e) => e.kind === "word");
  const now = Date.now();

  const row = (id: string, title: React.ReactNode, sub: string, left: number, label: string) => (
    <div
      key={id}
      style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-color, #e2e8f0)" }}
    >
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4 }}>
        {title}
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {sub} • còn {left} ngày
        </div>
      </span>
      <MyButton variant="outline" size="sm" onClick={() => restore(id, label)}>
        Khôi phục
      </MyButton>
      <MyButton variant="ghost" size="sm" onClick={() => removeFromTrash(id)} title="Xóa vĩnh viễn mục này" aria-label={`Xóa vĩnh viễn ${label}`}>
        ✕
      </MyButton>
    </div>
  );

  return (
    <MyModal title="Thùng rác" onClose={onClose} maxWidth="560px" footer={<CloseFooter onClose={onClose} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Thẻ và bộ thẻ vừa xóa được giữ {TRASH_DAYS} ngày trên thiết bị này để bạn khôi phục nếu lỡ tay. Thùng rác không được đồng bộ sang thiết bị khác.
        </p>
        {message && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245, 158, 11, 0.15)", color: "#b45309", fontSize: 13 }} role="status">
            {message}
          </div>
        )}
        {trash.length === 0 ? (
          <p style={{ margin: 0 }}>Thùng rác đang trống.</p>
        ) : (
          <>
            {decks.length > 0 && <b style={{ fontSize: 13 }}>Bộ thẻ ({decks.length})</b>}
            {decks.map((e) => row(e.id, <b>{e.deck?.name}</b>, `${e.deck?.words.length || 0} thẻ`, daysLeft(e, now), e.deck?.name || "bộ thẻ"))}
            {words.length > 0 && <b style={{ fontSize: 13 }}>Thẻ ({words.length})</b>}
            {words.map((e) =>
              row(
                e.id,
                <>
                  <b>{e.word?.source}</b> — {e.word ? firstMeaning(e.word.target) : ""}
                </>,
                `từ bộ “${e.deckName}”`,
                daysLeft(e, now),
                e.word?.source || "thẻ"
              )
            )}
            <div>
              <MyButton
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (await confirmDialog({ title: "Dọn sạch thùng rác", message: `Xóa vĩnh viễn ${trash.length} mục trong thùng rác? Không thể hoàn tác.`, confirmLabel: "Xóa vĩnh viễn", danger: true })) emptyTrash();
                }}
              >
                Dọn sạch thùng rác
              </MyButton>
            </div>
          </>
        )}
      </div>
    </MyModal>
  );
}
