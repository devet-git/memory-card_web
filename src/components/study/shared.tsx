import { useMemo } from "react";
import styled from "styled-components";
import { WordItem } from "types";

export interface StudyModeProps {
  words: WordItem[];
  onAnswer: (wordId: string | number, correct: boolean) => void;
  speechRate?: number;
}

/**
 * Recording an answer updates review stats, giving `words` a new identity on every answer.
 * Study modes shuffle from this stable list so the question order doesn't reshuffle mid-session.
 */
export function useStableWords(words: WordItem[]): WordItem[] {
  const signature = words.map((w) => `${w.id}|${w.source}|${w.target}|${w.example || ""}`).join("\n");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => words, [signature]);
}

export const shuffled = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Case/accents-insensitive, punctuation-free comparison used by typed answers. */
export const normalizeAnswer = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export const ModeWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
`;

export const ModeCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  @media (max-width: 640px) {
    padding: 18px 14px;
  }
`;

export const ModeMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
`;

export const AnswerInput = styled.input<{ $state: "idle" | "correct" | "wrong" }>`
  width: 100%;
  max-width: 420px;
  padding: 12px 14px;
  font-size: 18px;
  text-align: center;
  border-radius: 10px;
  border: 2px solid
    ${(p) => (p.$state === "correct" ? "#10b981" : p.$state === "wrong" ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #0f172a);
  outline: none;

  &:focus {
    border-color: ${(p) => (p.$state === "idle" ? "#3b82f6" : undefined)};
  }
`;

export const Feedback = styled.div<{ $ok: boolean }>`
  font-weight: 700;
  color: ${(p) => (p.$ok ? "#059669" : "#dc2626")};
`;
