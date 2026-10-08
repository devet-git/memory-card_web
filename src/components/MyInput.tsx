import styled from "styled-components";

interface MyInputProps {
  bgColor?: string;
  hasError?: boolean;
  $bgColor?: string;
  $hasError?: boolean;
}

export const MyInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !["hasError", "bgColor", "$hasError", "$bgColor"].includes(prop)
})<MyInputProps>`
  font-size: 15px;
  font-family: inherit;
  font-weight: 500;
  padding: 10px 14px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${(props) => (props.hasError || props.$hasError ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background-color: ${(props) => props.$bgColor || props.bgColor || "var(--bg-secondary, #ffffff)"};
  color: var(--text-primary, #0f172a);
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--text-muted, #94a3b8);
    font-weight: 400;
  }

  &:focus {
    border-color: ${(props) => (props.hasError || props.$hasError ? "#ef4444" : "var(--border-focus, #3b82f6)")};
    box-shadow: 0 0 0 3px ${(props) => (props.hasError || props.$hasError ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)")};
  }

  &:disabled {
    background-color: var(--bg-tertiary, #f1f5f9);
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const MyTextarea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => !["hasError", "bgColor", "$hasError", "$bgColor"].includes(prop)
})<MyInputProps>`
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  padding: 10px 14px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${(props) => (props.hasError || props.$hasError ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background-color: ${(props) => props.$bgColor || props.bgColor || "var(--bg-secondary, #ffffff)"};
  color: var(--text-primary, #0f172a);
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 80px;

  &::placeholder {
    color: var(--text-muted, #94a3b8);
  }

  &:focus {
    border-color: var(--border-focus, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;
