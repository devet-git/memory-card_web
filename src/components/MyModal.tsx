import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { IoClose } from "react-icons/io5";
import ConfirmDialog from "components/ConfirmDialog";

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;

  @media (max-width: 640px) {
    padding: 10px;
    align-items: flex-end;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div<{ $maxWidth?: string }>`
  background-color: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  width: 100%;
  max-width: ${(props) => props.$maxWidth || "520px"};
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 640px) {
    max-height: 86vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalHeader = styled.header`
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-secondary, #ffffff);

  @media (max-width: 640px) {
    padding: 14px 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    margin: 0;

    @media (max-width: 640px) {
      font-size: 16px;
    }
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--bg-tertiary, #f1f5f9);
    color: var(--text-primary, #0f172a);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  color: var(--text-primary, #0f172a);

  @media (max-width: 640px) {
    padding: 16px 14px;
  }
`;

// Stays pinned between the header and the scrolling body (tabs, filters)
const ModalToolbar = styled.div`
  flex-shrink: 0;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-secondary, #ffffff);

  @media (max-width: 640px) {
    padding: 8px 14px;
  }
`;

// Stays pinned under the scrolling body (actions, status messages)
const ModalFooter = styled.footer`
  flex-shrink: 0;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-secondary, #ffffff);

  @media (max-width: 640px) {
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
  }
`;

export interface ModalGuard {
  /** While true, closing the modal first asks for confirmation (e.g. an AI request is running) */
  when: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  stayLabel?: string;
}

interface MyModalProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  toolbar?: React.ReactNode; // pinned under the title; does not scroll with the content
  onClose: () => void;
  maxWidth?: string;
  guard?: ModalGuard;
}

/** Lets AI requests started inside a modal tell it they're running, so closing the modal asks first. */
export const ModalAIScope = createContext<{ report: (busy: boolean) => void } | null>(null);

export const AI_CLOSE_WARNING =
  "AI đang xử lý yêu cầu của bạn. Nếu hủy bây giờ, nhà cung cấp vẫn có thể tính phí token cho phần đã xử lý nhưng bạn sẽ không nhận được kết quả.";

// Only the top-most modal reacts to Escape, so a confirmation on top of a modal doesn't close both.
const modalStack: symbol[] = [];

export default function MyModal({
  title,
  children,
  footer,
  toolbar,
  onClose,
  maxWidth,
  guard,
}: MyModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [childAiJobs, setChildAiJobs] = useState(0);
  const scope = useMemo(() => ({ report: (busy: boolean) => setChildAiJobs((n) => Math.max(0, n + (busy ? 1 : -1))) }), []);
  const effectiveGuard = guard?.when ? guard : childAiJobs > 0 ? { when: true, title: "Hủy yêu cầu AI?", message: AI_CLOSE_WARNING, confirmLabel: "Hủy và đóng", stayLabel: "Tiếp tục chờ" } : undefined;
  const idRef = useRef<symbol>(Symbol("modal"));

  const requestClose = () => {
    if (effectiveGuard?.when) setConfirming(true);
    else onClose();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const id = idRef.current;
    modalStack.push(id);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack[modalStack.length - 1] === id) {
        requestCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const i = modalStack.indexOf(id);
      if (i >= 0) modalStack.splice(i, 1);
    };
  }, []);

  return (
    <>
      <Backdrop onClick={requestClose}>
        <ModalContent $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h3>{title}</h3>
            <CloseButton onClick={requestClose} title="Đóng (Esc)">
              <IoClose size={22} />
            </CloseButton>
          </ModalHeader>
          {toolbar && <ModalToolbar>{toolbar}</ModalToolbar>}
          <ModalBody>
          <ModalAIScope.Provider value={scope}>{children}</ModalAIScope.Provider>
        </ModalBody>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContent>
      </Backdrop>
      {confirming && effectiveGuard && (
        <ConfirmDialog
          title={effectiveGuard.title}
          message={effectiveGuard.message}
          confirmLabel={effectiveGuard.confirmLabel}
          cancelLabel={effectiveGuard.stayLabel}
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
