import styled from "styled-components";
import { IoClose } from "react-icons/io5";
import ConfirmDialog from "components/ConfirmDialog";
import { answerConfirm, dismissToast, ToastType, useDialogState } from "utils/dialogs";

const COLORS: Record<ToastType, string> = { info: "#3b82f6", success: "#10b981", error: "#ef4444" };

const ToastStack = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 10001; // above modals (their backdrop is 9999)
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(440px, calc(100vw - 24px));
  pointer-events: none;

  @media (max-width: 640px) {
    bottom: calc(84px + env(safe-area-inset-bottom, 0px)); // above the bottom navigation
  }
`;

const ToastItem = styled.div<{ $type: ToastType }>`
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #0f172a);
  border: 1px solid var(--border-color, #e2e8f0);
  border-left: 4px solid ${(p) => COLORS[p.$type]};
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  font-size: 14px;
  line-height: 1.45;

  span {
    flex: 1;
    white-space: pre-line;
  }

  button {
    border: none;
    background: none;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
  }
`;

/** Draws the app's confirm dialogs and toasts (see utils/dialogs.ts). Mounted once, in App. */
export default function DialogHost() {
  const { confirms, toasts } = useDialogState();
  const current = confirms[0];
  return (
    <>
      {current && (
        <ConfirmDialog
          key={current.id}
          title={current.title}
          message={current.message}
          confirmLabel={current.confirmLabel}
          cancelLabel={current.cancelLabel}
          danger={current.danger}
          onConfirm={() => answerConfirm(current.id, true)}
          onCancel={() => answerConfirm(current.id, false)}
        />
      )}
      {toasts.length > 0 && (
        <ToastStack>
          {toasts.map((t) => (
            <ToastItem key={t.id} $type={t.type} role={t.type === "error" ? "alert" : "status"}>
              <span>{t.text}</span>
              <button onClick={() => dismissToast(t.id)} aria-label="Đóng thông báo">
                <IoClose size={18} />
              </button>
            </ToastItem>
          ))}
        </ToastStack>
      )}
    </>
  );
}
