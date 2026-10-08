import React, { useEffect } from "react";
import styled from "styled-components";
import { IoClose } from "react-icons/io5";

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

interface MyModalProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}

export default function MyModal({ title, children, footer, onClose, maxWidth }: MyModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Backdrop onClick={onClose}>
      <ModalContent $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>{title}</h3>
          <CloseButton onClick={onClose} title="Đóng (Esc)">
            <IoClose size={22} />
          </CloseButton>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Backdrop>
  );
}
