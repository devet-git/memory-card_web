import React from "react";
import styled from "styled-components";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "success";

interface ButtonProps {
  variant?: ButtonVariant;
  bgColor?: string;
  color?: string;
  fontSz?: number;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  user-select: none;
  width: ${(props) => (props.fullWidth ? "100%" : "auto")};

  ${(props) => {
    switch (props.size) {
      case "sm":
        return `
          padding: 6px 12px;
          font-size: 13px;
        `;
      case "lg":
        return `
          padding: 12px 24px;
          font-size: 16px;
        `;
      default:
        return `
          padding: 8px 16px;
          font-size: 14px;
        `;
    }
  }}

  ${(props) => {
    if (props.bgColor) {
      return `
        background-color: ${props.bgColor};
        color: ${props.color || "white"};
        &:hover {
          filter: brightness(0.92);
          transform: translateY(-1px);
        }
      `;
    }

    switch (props.variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
          &:hover {
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
            transform: translateY(-1px);
          }
        `;
      case "secondary":
        return `
          background-color: var(--bg-tertiary, #f1f5f9);
          color: var(--text-primary, #0f172a);
          border: 1px solid var(--border-color, #e2e8f0);
          &:hover {
            background-color: var(--border-color, #e2e8f0);
          }
        `;
      case "success":
        return `
          background-color: #10b981;
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          &:hover {
            background-color: #059669;
            transform: translateY(-1px);
          }
        `;
      case "danger":
        return `
          background-color: #ef4444;
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
          &:hover {
            background-color: #dc2626;
            transform: translateY(-1px);
          }
        `;
      case "ghost":
        return `
          background-color: transparent;
          color: var(--text-secondary, #475569);
          &:hover {
            background-color: rgba(148, 163, 184, 0.15);
            color: var(--text-primary, #0f172a);
          }
        `;
      case "outline":
        return `
          background-color: transparent;
          border: 1px solid var(--border-color, #cbd5e1);
          color: var(--text-primary, #0f172a);
          &:hover {
            border-color: var(--accent-primary, #3b82f6);
            color: var(--accent-primary, #3b82f6);
            background-color: rgba(59, 130, 246, 0.05);
          }
        `;
      default:
        return `
          background-color: var(--bg-tertiary, #f1f5f9);
          color: var(--text-primary, #0f172a);
          border: 1px solid var(--border-color, #e2e8f0);
          &:hover {
            background-color: rgba(148, 163, 184, 0.2);
          }
        `;
    }
  }}

  &:active {
    transform: translateY(0);
    filter: brightness(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  svg {
    font-size: ${(props) => (props.fontSz ? `${props.fontSz + 2}px` : "1.15em")};
    flex-shrink: 0;
  }
`;

export interface Props {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  color?: string;
  bgColor?: string;
  fontSz?: number;
  className?: string;
  title?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function MyButton({
  children,
  icon,
  onClick,
  color,
  bgColor,
  fontSz,
  className,
  title,
  variant = "secondary",
  size = "md",
  fullWidth,
  disabled,
  type = "button"
}: Props) {
  return (
    <StyledButton
      type={type}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      bgColor={bgColor}
      color={color}
      fontSz={fontSz}
      onClick={onClick}
      className={className}
      title={title}
      disabled={disabled}
    >
      {icon}
      {children}
    </StyledButton>
  );
}
