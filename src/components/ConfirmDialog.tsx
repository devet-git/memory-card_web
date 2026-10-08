import React from "react";
import MyModal from "components/MyModal";
import MyButton from "components/MyButton";

interface Props {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small yes/no dialog that sits on top of whatever is open. Escape or the backdrop means "no". */
export default function ConfirmDialog({
  title = "Xác nhận",
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Quay lại",
  danger = false,
  onConfirm,
  onCancel
}: Props) {
  return (
    <MyModal
      title={title}
      onClose={onCancel}
      maxWidth="420px"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <MyButton variant="primary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </MyButton>
          <MyButton variant={danger ? "danger" : "secondary"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </MyButton>
        </div>
      }
    >
      <div role="alertdialog" aria-label={title} style={{ fontSize: 14, lineHeight: 1.55 }}>
        {message}
      </div>
    </MyModal>
  );
}
