import React, { useState } from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";
import { MyInput } from "components/MyInput";
import { CollectionItem } from "types";
import SearchSelect from "components/SearchSelect";

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
        <SearchSelect
          value={choice}
          onChange={setChoice}
          options={[
            ...others.map((c) => ({ value: c.pathname, label: c.name, description: `${c.words.length} thẻ${c.category ? ` • ${c.category}` : ""}` })),
            { value: NEW_DECK, label: "+ Tạo bộ thẻ mới" }
          ]}
          placeholder="Chọn bộ thẻ đích"
          searchPlaceholder="Tìm bộ thẻ..."
          emptyText="Không có bộ thẻ nào khớp"
          ariaLabel="Bộ thẻ đích"
        />
        {choice === NEW_DECK && <MyInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên bộ thẻ mới" autoFocus />}
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
      </div>
    </MyModal>
  );
}
