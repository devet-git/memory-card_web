import React, { useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import { CollectionItem } from "types";

interface Props {
  mode: "move" | "copy";
  count: number;
  currentPathname: string;
  collections: CollectionItem[];
  onConfirm: (target: { to?: string; newDeckName?: string }) => string | null; // returns an error message or null on success
  onClose: () => void;
}

const NEW_DECK = "__new__";

/** Pick the destination collection (or create one) for moving / copying the selected cards. */
export default function TransferWordsModal({ mode, count, currentPathname, collections, onConfirm, onClose }: Props) {
  const others = collections.filter((c) => c.pathname !== currentPathname);
  const [choice, setChoice] = useState<string>(others[0]?.pathname || NEW_DECK);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verb = mode === "move" ? "Chuyển" : "Sao chép";

  const confirm = () => {
    const err = onConfirm(choice === NEW_DECK ? { newDeckName: newName } : { to: choice });
    if (err) setError(err);
  };

  return (
    <MyModal
      title={`${verb} ${count} thẻ`}
      onClose={onClose}
      maxWidth="460px"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <MyButton variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </MyButton>
          <MyButton variant="primary" size="sm" onClick={confirm} disabled={choice === NEW_DECK && !newName.trim()}>
            {verb}
          </MyButton>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          {mode === "move" ? "Các thẻ sẽ được chuyển (giữ nguyên tiến độ học)." : "Các thẻ sẽ được nhân bản sang bộ đích."} Thẻ có mặt trước đã tồn
          tại ở bộ đích sẽ được bỏ qua.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflow: "auto" }}>
          {others.map((c) => (
            <label key={c.pathname} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 10, cursor: "pointer" }}>
              <input type="radio" name="target-deck" checked={choice === c.pathname} onChange={() => setChoice(c.pathname)} />
              <span style={{ fontSize: 14 }}>
                <strong>{c.name}</strong> <span style={{ color: "var(--text-muted)" }}>• {c.words.length} thẻ</span>
              </span>
            </label>
          ))}
          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", border: "1px dashed var(--border-color, #cbd5e1)", borderRadius: 10, cursor: "pointer" }}>
            <input type="radio" name="target-deck" checked={choice === NEW_DECK} onChange={() => setChoice(NEW_DECK)} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>+ Tạo bộ thẻ mới</span>
          </label>
        </div>
        {choice === NEW_DECK && <MyInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên bộ thẻ mới" autoFocus />}
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
      </div>
    </MyModal>
  );
}
