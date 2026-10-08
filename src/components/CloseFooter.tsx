import React from "react";
import MyButton from "components/MyButton";

/** Pinned footer for modals that only need a way out. */
export default function CloseFooter({ onClose, label = "Đóng" }: { onClose: () => void; label?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <MyButton variant="primary" size="sm" onClick={onClose}>
        {label}
      </MyButton>
    </div>
  );
}
