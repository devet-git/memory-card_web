import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import {
  MdArrowBack,
  MdQuiz,
  MdKeyboardAlt,
  MdViewModule,
  MdTableRows,
  MdVolumeUp,
  MdOutlineShuffle,
  MdPlayArrow,
  MdPause,
  MdOutlineSwapHoriz,
  MdCheck,
  MdClose,
  MdOutlineLightbulb,
  MdRestartAlt,
  MdAutoAwesome,
  MdMic
} from "react-icons/md";
import { IoFlashOutline } from "react-icons/io5";
import { AiFillStar, AiOutlineStar, AiOutlinePlus, AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import useCollectionContext from "contexts/Collection";
import FlipCard from "components/FlipCard";
import MyButton from "components/MyButton";
import { MyInput, MyTextarea } from "components/MyInput";
import MyModal from "components/MyModal";
import { speakWord } from "utils/speech";
import { Grade } from "utils/srs";
import AutoFillButton from "components/AutoFillButton";
import ActionMenu from "components/ActionMenu";
import WordSuggest from "components/WordSuggest";
import SuggestWordsModal from "components/SuggestWordsModal";
import AIEnrichButton from "components/ai/AIEnrichButton";
import useAIConfig from "hooks/useAIConfig";
import AIGenerateModal from "components/ai/AIGenerateModal";
import SentencePractice from "components/study/SentencePractice";
import Speaking from "components/study/Speaking";
import AIStoryModal from "components/ai/AIStoryModal";
import Dictation from "components/study/Dictation";
import Cloze from "components/study/Cloze";
import Matching from "components/study/Matching";
import { csvToBulkText, collectionToCsv, safeFileName } from "utils/csv";
import { downloadTextFile } from "utils/download";
import { buildShareUrl } from "utils/share";
import { LookupResult } from "utils/dictionary";
import { lookupBest, formatPos } from "utils/localDict";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { playSound } from "utils/sound";
import { WordItem, MasteryStatus } from "types";

type StudyMode = "card" | "quiz" | "typing" | "dictation" | "cloze" | "speaking" | "sentence" | "match" | "grid" | "table";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px), (max-height: 820px) {
    gap: 10px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 10px 16px;
  box-shadow: var(--card-shadow, 0 4px 12px -2px rgba(0, 0, 0, 0.06));

  @media (max-width: 768px) {
    padding: 8px 10px;
    border-radius: 12px;
  }
`;

// Only the mode tabs stay pinned while scrolling, so the pinned strip is one slim row
const StickyTabs = styled.div`
  position: sticky;
  top: 0;
  z-index: 80;
  margin: -6px 0;
  padding: 6px 0;
  background: var(--bg-primary, #f8fafc);
`;

const StickyStudyFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  @media (max-width: 640px) {
    position: sticky;
    bottom: calc(58px + env(safe-area-inset-bottom, 0px));
    z-index: 70;
    background: var(--bg-card, #ffffff);
    padding: 10px 12px;
    gap: 8px;
    border-radius: 14px;
    border: 1px solid var(--border-color, #e2e8f0);
    box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.08);
  }
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    gap: 8px;

    /* phones: action buttons shrink to their icons */
    .lbl {
      display: none;
    }
  }
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 8px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary, #f1f5f9);
    color: var(--text-primary, #0f172a);
    font-size: 20px;
    transition: all 0.15s ease;
    flex-shrink: 0;

    @media (max-width: 640px) {
      width: 34px;
      height: 34px;
      font-size: 18px;
    }

    &:hover {
      background: var(--border-color, #e2e8f0);
      color: #3b82f6;
    }
  }

  h1 {
    font-size: 19px;
    font-weight: 800;
    margin: 0;
    color: var(--text-primary, #0f172a);
    overflow-wrap: anywhere;

    @media (max-width: 640px) {
      font-size: 16px;
    }
  }

  .cat-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 9999px;
    background-color: rgba(59, 130, 246, 0.12);
    color: #2563eb;
    white-space: nowrap;
  }
`;

const ModeTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary, #f1f5f9);
  padding: 3px;
  border-radius: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModeTab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  background-color: ${(props) => (props.$active ? "var(--bg-card, #ffffff)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "var(--text-secondary, #64748b)")};
  box-shadow: ${(props) => (props.$active ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none")};
  transition: all 0.15s ease;
  flex-shrink: 0;

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 12px;
    gap: 4px;
  }

  &:hover {
    color: var(--text-primary, #0f172a);
  }
`;

/* FLASHCARD STUDY STYLES */
const StudyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 640px), (max-height: 820px) {
    gap: 12px;
  }
`;

const StudyToolBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterChip = styled.button<{ $active: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${(props) => (props.$active ? "#3b82f6" : "var(--bg-card, #ffffff)")};
  color: ${(props) => (props.$active ? "#ffffff" : "var(--text-secondary, #64748b)")};
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "var(--border-color, #e2e8f0)")};
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CardControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;

  @media (max-width: 640px) {
    gap: 8px;

    button {
      padding: 7px 10px;
      font-size: 13px;
    }
  }
`;

const NavigationCounter = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const RatingBar = styled.div`
  display: flex;
  gap: 14px;
  width: 100%;
  justify-content: center;
  margin-top: 8px;

  @media (max-width: 640px) {
    gap: 8px;
    margin-top: 4px;
  }
`;

const RateButton = styled.button<{ $color: string }>`
  flex: 1;
  max-width: 260px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-weight: 700;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.05));
  transition: all 0.15s ease;

  @media (max-width: 640px) {
    padding: 10px 4px;
    font-size: 12px;
    border-radius: 10px;
    gap: 2px;

    .key-hint {
      display: none;
    }
  }

  .key-hint {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted, #94a3b8);
  }

  &:hover {
    border-color: ${(props) => props.$color};
    color: ${(props) => props.$color};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

/* QUIZ STYLES */
const QuizContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QuizCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;

  @media (max-width: 640px) {
    padding: 20px 14px;
    gap: 14px;
    border-radius: 16px;
  }

  .quiz-q-label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-primary, #3b82f6);
  }

  .quiz-term {
    font-size: 32px;
    font-weight: 800;
    color: var(--text-primary, #0f172a);
    margin: 0;
    word-break: break-word;

    @media (max-width: 640px) {
      font-size: 22px;
    }
  }
`;

const QuizOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  width: 100%;

  @media (min-width: 680px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 640px) {
    gap: 10px;
  }
`;

const OptionButton = styled.button<{
  $isSelected: boolean;
  $isCorrect?: boolean;
  $showResult: boolean;
}>`
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  border: 2px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) {
    padding: 12px 14px;
    font-size: 14px;

    .key-shortcut-hint {
      display: none !important;
    }
  }

  ${(props) => {
    if (props.$showResult) {
      if (props.$isCorrect) {
        return `
          border-color: #10b981;
          background-color: rgba(16, 185, 129, 0.12);
          color: #059669;
        `;
      }
      if (props.$isSelected && !props.$isCorrect) {
        return `
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        `;
      }
    }
    if (props.$isSelected) {
      return `
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.08);
      `;
    }
    return `
      &:hover {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.04);
      }
    `;
  }}
`;

const QuizProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: var(--border-color, #e2e8f0);
  border-radius: 9999px;
  overflow: hidden;

  .fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 9999px;
    transition: width 0.3s ease;
  }
`;

const QuizToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const QuizToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 640px) {
    width: 100%;
    button {
      flex: 1;
      justify-content: center;
      font-size: 12px;
      padding: 6px 8px;
    }
  }
`;

const QuizPillButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "var(--border-color, #e2e8f0)")};
  background-color: ${(props) => (props.$active ? "rgba(59, 130, 246, 0.1)" : "var(--bg-card, #ffffff)")};
  color: ${(props) => (props.$active ? "#2563eb" : "var(--text-secondary, #64748b)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #3b82f6;
    color: #2563eb;
  }
`;

const QuizInfoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  background-color: rgba(16, 185, 129, 0.1);
  padding: 4px 10px;
  border-radius: 9999px;
`;

const QuizExampleBox = styled.div`
  width: 100%;
  background-color: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  color: var(--text-primary, #0f172a);
  animation: fadeIn 0.2s ease;

  .example-label {
    font-size: 12px;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 4px;
  }
  .example-text {
    font-style: italic;
    color: var(--text-secondary, #475569);
  }
`;

const QuizSummaryReview = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  text-align: left;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
`;

const QuizReviewItem = styled.div<{ $isCorrect: boolean }>`
  background: var(--bg-card, #ffffff);
  border: 1px solid ${(props) => (props.$isCorrect ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)")};
  border-left: 4px solid ${(props) => (props.$isCorrect ? "#10b981" : "#ef4444")};
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  .review-prompt {
    font-weight: 700;
    font-size: 15px;
    color: var(--text-primary, #0f172a);
    margin-bottom: 4px;
  }
  .review-ans {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
  .review-correct {
    color: #059669;
    font-weight: 600;
  }
  .review-wrong {
    color: #dc2626;
    text-decoration: line-through;
    margin-right: 6px;
  }
`;

/* TYPING PRACTICE STYLES */
const TypingContainer = styled.div`
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 640px) {
    gap: 14px;
  }
`;

const TypingCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;

  @media (max-width: 640px) {
    padding: 20px 14px;
    gap: 14px;
    border-radius: 16px;

    h2 {
      font-size: 20px;
    }
  }
`;

/* GRID & TABLE VIEW STYLES */
const WordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const TableWrapper = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));

  @media (max-width: 640px) {
    border-radius: 14px;
  }
`;

const DesktopTableContainer = styled.div`
  display: block;

  @media (max-width: 640px) {
    display: none;
  }
`;

const MobileCardList = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;

const MobileWordCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.04));

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;

    .word-head {
      display: flex;
      align-items: center;
      gap: 8px;

      .term {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
      }

      .phonetic {
        font-size: 13px;
        color: #3b82f6;
        font-family: monospace;
      }
    }
  }

  .def {
    font-size: 14px;
    font-weight: 600;
    color: #2563eb;
    margin: 0;
  }

  .example {
    font-size: 12px;
    font-style: italic;
    color: var(--text-secondary, #64748b);
    margin: 0;
    line-height: 1.4;
  }

  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px dashed var(--border-color, #e2e8f0);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;

  th {
    position: sticky;
    top: 0;
    z-index: 5;
    background-color: var(--bg-tertiary, #f1f5f9);
    padding: 14px 16px;
    font-weight: 700;
    color: var(--text-secondary, #475569);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-primary, #0f172a);
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background-color: rgba(59, 130, 246, 0.03);
  }
`;

const StatusBadge = styled.span<{ $status?: MasteryStatus }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  line-height: 1;
  letter-spacing: 0.01em;
  ${(props) => {
    switch (props.$status) {
      case "mastered":
        return `
          background-color: rgba(16, 185, 129, 0.15);
          color: #059669;
        `;
      case "learning":
        return `
          background-color: rgba(245, 158, 11, 0.15);
          color: #d97706;
        `;
      default:
        return `
          background-color: rgba(148, 163, 184, 0.15);
          color: #64748b;
        `;
    }
  }}
`;

const CompletionCelebration = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 48px 36px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: var(--card-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1));

  .trophy {
    font-size: 64px;
    animation: bounce 1s infinite alternate;
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-8px); }
  }

  h2 {
    font-size: 26px;
    font-weight: 800;
    margin: 0;
  }

  p {
    margin: 0;
    color: var(--text-secondary, #64748b);
    line-height: 1.5;
  }
`;

export default function WordPage() {
  const { speak, isLoading: isSpeakLoading } = useSpeak();
  const aiReady = Boolean(useAIConfig());
  const { collectionName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    collections,
    addWord,
    updateWord,
    deleteWord,
    toggleStar,
    updateWordStatus,
    recordReview,
    bulkImportWords,
    settings
  } = useCollectionContext();

  const currentMode = (searchParams.get("mode") as StudyMode) || "card";
  const setMode = (mode: StudyMode) => {
    setSearchParams({ mode });
  };

  const selectedCollection = collections.find((c) => c.pathname === collectionName);

  // Modals state
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showAIStory, setShowAIStory] = useState(false);
  const [showSuggestWords, setShowSuggestWords] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);

  // New word form state
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newMnemonic, setNewMnemonic] = useState("");
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkFillNote, setBulkFillNote] = useState<string | null>(null);

  // Search & filter
  const [tableSearch, setTableSearch] = useState(searchParams.get("q") || ""); // "q" comes from global search
  const [filterType, setFilterType] = useState<"all" | "starred" | "learning" | "mastered">("all");

  // Study card state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReverseMode, setIsReverseMode] = useState(false); // false: term->def, true: def->term
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isCompletedSession, setIsCompletedSession] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizShuffleQuestions, setQuizShuffleQuestions] = useState(true);
  const [quizReverseMode, setQuizReverseMode] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState(1);
  const [retryOnlyWordIds, setRetryOnlyWordIds] = useState<Set<string | number> | null>(null);
  const [quizHistory, setQuizHistory] = useState<
    Array<{
      questionId: string | number;
      prompt: string;
      phonetic?: string;
      example?: string;
      selectedOption: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>
  >([]);

  // Typing practice state
  const [typingInput, setTypingInput] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingResult, setTypingResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [showTypingHint, setShowTypingHint] = useState(false);

  const words = useMemo(() => selectedCollection?.words || [], [selectedCollection]);

  // Filtered words for study
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (filterType === "starred") return Boolean(w.starred);
      if (filterType === "learning") return w.status === "learning" || w.status === "new";
      if (filterType === "mastered") return w.status === "mastered";
      return true;
    });
  }, [words, filterType]);

  // Order of words (regular or shuffled)
  const displayWords = useMemo(() => {
    if (!isShuffled || shuffledIndices.length !== filteredWords.length) {
      return filteredWords;
    }
    return shuffledIndices.map((i) => filteredWords[i]).filter(Boolean);
  }, [filteredWords, isShuffled, shuffledIndices]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsCompletedSession(false);
  }, [filterType]);

  // Handle shuffle toggle
  const handleToggleShuffle = () => {
    if (!isShuffled) {
      const indices = Array.from({ length: filteredWords.length }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffled(true);
    } else {
      setIsShuffled(false);
    }
    setCurrentIndex(0);
  };

  // Autoplay timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlay && displayWords.length > 0 && !isCompletedSession) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev < displayWords.length - 1) {
            return prev + 1;
          } else {
            setIsAutoPlay(false);
            setIsCompletedSession(true);
            return prev;
          }
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, displayWords.length, isCompletedSession]);

  // Card navigation
  const handleNextCard = useCallback(() => {
    if (currentIndex < displayWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompletedSession(true);
      playSound("complete");
    }
  }, [currentIndex, displayWords.length]);

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsCompletedSession(false);
    }
  }, [currentIndex]);

  const handleRateCard = (status: MasteryStatus, grade?: Grade) => {
    const currentWord = displayWords[currentIndex];
    if (currentWord && collectionName) {
      updateWordStatus(collectionName, currentWord.id, status, grade);
      playSound(status === "mastered" ? "correct" : "click");
      handleNextCard();
    }
  };

  // Keyboard shortcuts during flashcard mode
  useEffect(() => {
    if (currentMode !== "card" || displayWords.length === 0 || isCompletedSession) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const currentWord = displayWords[currentIndex];
        if (currentWord) {
          speakWord(isReverseMode ? currentWord.target : currentWord.source);
        }
      } else if (e.key === "1") {
        e.preventDefault();
        handleRateCard("learning", 0);
      } else if (e.key === "2") {
        e.preventDefault();
        handleRateCard("learning", 1);
      } else if (e.key === "3") {
        e.preventDefault();
        handleRateCard("mastered", 3);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        const currentWord = displayWords[currentIndex];
        if (currentWord && collectionName) {
          toggleStar(collectionName, currentWord.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, displayWords, currentIndex, isCompletedSession, isReverseMode, handleNextCard, handlePrevCard, collectionName]);

  // Add Single Word
  const handleAddSingleWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim() || !newTarget.trim()) return;
    if (collectionName) {
      addWord(collectionName, {
        source: newSource.trim(),
        target: newTarget.trim(),
        phonetic: newPhonetic.trim() || undefined,
        example: newExample.trim() || undefined,
        image: newImage.trim() || undefined,
        mnemonic: newMnemonic.trim() || undefined,
        status: "new",
        starred: false
      });
      setNewSource("");
      setNewTarget("");
      setNewPhonetic("");
      setNewExample("");
      setNewImage("");
      setNewMnemonic("");
      setShowAddSingleModal(false);
    }
  };

  // Lines holding just an English word get their meaning (and example) from the offline dictionary
  const handleBulkAutoFill = async () => {
    const lines = bulkText.split("\n");
    let filled = 0;
    let missed = 0;
    const out: string[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || /[\t,:|]| - /.test(line) || !/^[A-Za-z][A-Za-z' -]*$/.test(line)) {
        out.push(raw);
        continue;
      }
      const hit = await lookupBest(line).catch(() => null);
      const meaning = hit?.vi || (hit?.def ? `${hit.pos ? `(${formatPos(hit.pos)}) ` : ""}${hit.def}` : "");
      if (!meaning) {
        missed++;
        out.push(raw);
        continue;
      }
      filled++;
      out.push([line, meaning, hit?.example || ""].filter((p, i) => i < 2 || p).join(" - "));
    }
    setBulkText(out.join("\n"));
    setBulkFillNote(`Đã điền nghĩa cho ${filled} từ${missed ? `, ${missed} từ chưa có trong từ điển` : ""}.`);
  };

  // Bulk Import
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim() || !collectionName) return;
    const count = bulkImportWords(collectionName, bulkText);
    alert(`Đã thêm thành công ${count} từ vựng!`);
    setBulkText("");
    setShowBulkModal(false);
  };

  // Save Edit Word
  const handleSaveEditWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord || !collectionName) return;
    updateWord(collectionName, editingWord.id, {
      source: editingWord.source,
      target: editingWord.target,
      phonetic: editingWord.phonetic,
      example: editingWord.example,
      image: editingWord.image?.trim() || undefined,
      mnemonic: editingWord.mnemonic?.trim() || undefined
    });
    setShowEditModal(false);
    setEditingWord(null);
  };

  // FISHER-YATES SHUFFLE UTILITY
  const shuffleArray = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  };

  // Cards whose front repeats an earlier/better-studied card; "Xóa bản sao" removes these
  const duplicateIds = useMemo(() => {
    const groups = new Map<string, WordItem[]>();
    words.forEach((w) => {
      const key = w.source.trim().toLowerCase();
      groups.set(key, [...(groups.get(key) || []), w]);
    });
    const ids: (string | number)[] = [];
    groups.forEach((list) => {
      if (list.length < 2) return;
      // keep the card with the most reviews (first one on ties)
      const keep = list.reduce((best, w) => ((w.reviewCount || 0) > (best.reviewCount || 0) ? w : best), list[0]);
      list.forEach((w) => w !== keep && ids.push(w.id));
    });
    return ids;
  }, [words]);

  const handleRemoveDuplicates = () => {
    if (!collectionName || duplicateIds.length === 0) return;
    if (!window.confirm(`Xóa ${duplicateIds.length} thẻ trùng? Thẻ được ôn nhiều nhất của mỗi từ sẽ được giữ lại.`)) return;
    duplicateIds.forEach((id) => deleteWord(collectionName, id));
  };

  // Active words pool for quiz (either all collection words, or only wrong ones during retry)
  // Recording an answer updates review stats, which gives `words` / `collections` a new identity.
  // Key the quiz on word *content* so options aren't reshuffled right after the user picks one.
  const wordsSignature = words.map((w) => `${w.id}|${w.source}|${w.target}`).join("\n");
  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;

  const activeQuizWords = useMemo(() => {
    if (retryOnlyWordIds && retryOnlyWordIds.size > 0) {
      const filtered = words.filter((w) => retryOnlyWordIds.has(w.id));
      if (filtered.length > 0) return filtered;
    }
    return words;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsSignature, retryOnlyWordIds]);

  // Robust Quiz Questions Generator: Always guarantees 4 distinct options randomly chosen from collection
  const quizQuestions = useMemo(() => {
    if (!activeQuizWords || activeQuizWords.length === 0) return [];

    let pool = [...activeQuizWords];
    if (quizShuffleQuestions) {
      pool = shuffleArray(pool);
    }

    // All available answers in the current collection
    const currentCollAnswers = words
      .map((w) => (quizReverseMode ? w.source : w.target)?.trim())
      .filter((txt): txt is string => Boolean(txt));

    // Answers from all other collections as extra pool if current collection has < 4 words
    const otherAnswers: string[] = [];
    collectionsRef.current.forEach((c) => {
      c.words?.forEach((w) => {
        const txt = (quizReverseMode ? w.source : w.target)?.trim();
        if (txt) otherAnswers.push(txt);
      });
    });

    const standardFallbacks = [
      "Chính xác, hoàn toàn đúng",
      "Thay đổi và phát triển liên tục",
      "Kết nối và đồng bộ hóa",
      "Khởi tạo và thực thi nhiệm vụ",
      "Tối ưu hóa hiệu năng và tốc độ",
      "Ghi nhớ trong thời gian dài",
      "Phương pháp tiếp cận hiệu quả",
      "Dễ dàng thực hiện trong thực tế",
      "Mục tiêu cần hoàn thành",
      "Phân tích và đánh giá kết quả"
    ];

    return pool.map((word) => {
      const prompt = (quizReverseMode ? word.target : word.source).trim();
      const correctAnswer = (quizReverseMode ? word.source : word.target).trim();

      // 1. Pick distractors from CURRENT collection first (all other words in this collection)
      const collectionCandidates = currentCollAnswers.filter(
        (ans) => ans.toLowerCase() !== correctAnswer.toLowerCase()
      );
      const uniqueCollectionCandidates = Array.from(new Set(collectionCandidates));
      const shuffledCollectionCandidates = shuffleArray(uniqueCollectionCandidates);

      const distractors: string[] = [];
      for (const item of shuffledCollectionCandidates) {
        if (distractors.length < 3 && !distractors.includes(item)) {
          distractors.push(item);
        }
      }

      // 2. If collection has fewer than 3 distractors, fill from other collections
      if (distractors.length < 3) {
        const otherCandidates = otherAnswers.filter(
          (ans) => ans.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(ans)
        );
        const shuffledOthers = shuffleArray(Array.from(new Set(otherCandidates)));
        for (const item of shuffledOthers) {
          if (distractors.length < 3 && !distractors.includes(item)) {
            distractors.push(item);
          }
        }
      }

      // 3. If still fewer than 3, fill from standard fallback educational answers
      if (distractors.length < 3) {
        const fallbackCandidates = standardFallbacks.filter(
          (ans) => ans.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(ans)
        );
        const shuffledFallbacks = shuffleArray(fallbackCandidates);
        for (const item of shuffledFallbacks) {
          if (distractors.length < 3 && !distractors.includes(item)) {
            distractors.push(item);
          }
        }
      }

      // Combine 1 correct answer + 3 distractors = guaranteed 4 total distinct options
      const finalFour = shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);

      return {
        id: word.id,
        word,
        prompt,
        phonetic: word.phonetic,
        example: word.example,
        correctAnswer,
        options: finalFour
      };
    });
    // quizSessionId is a deliberate re-shuffle trigger; words/collections are tracked via activeQuizWords/collectionsRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuizWords, quizReverseMode, quizShuffleQuestions, quizSessionId]);

  const currentQuizQuestion = quizQuestions[quizIndex];
  const quizOptions = currentQuizQuestion ? currentQuizQuestion.options : [];

  const handleSelectQuizOption = (option: string) => {
    if (quizSubmitted || !currentQuizQuestion) return;
    setQuizSelectedOption(option);
    setQuizSubmitted(true);

    const isCorrect = option.trim().toLowerCase() === currentQuizQuestion.correctAnswer.trim().toLowerCase();

    // Record into quiz history
    setQuizHistory((prev) => [
      ...prev,
      {
        questionId: currentQuizQuestion.id,
        prompt: currentQuizQuestion.prompt,
        phonetic: currentQuizQuestion.phonetic,
        example: currentQuizQuestion.example,
        selectedOption: option,
        correctAnswer: currentQuizQuestion.correctAnswer,
        isCorrect
      }
    ]);

    if (isCorrect) {
      playSound("correct");
      setQuizScore((prev) => prev + 1);
      if (collectionName) {
        recordReview(collectionName, currentQuizQuestion.word.id, true);
      }
    } else {
      playSound("wrong");
      if (collectionName) {
        recordReview(collectionName, currentQuizQuestion.word.id, false);
      }
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizSubmitted(false);
    } else {
      setQuizFinished(true);
      playSound("complete");
    }
  };

  const handleRestartQuiz = (keepSettings: boolean = true) => {
    setRetryOnlyWordIds(null);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizFinished(false);
    setQuizHistory([]);
    setQuizSessionId((prev) => prev + 1);
  };

  const handleRetryWrongQuestions = () => {
    const wrongIds = new Set(
      quizHistory.filter((h) => !h.isCorrect).map((h) => h.questionId)
    );
    if (wrongIds.size === 0) return;

    setRetryOnlyWordIds(wrongIds);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizFinished(false);
    setQuizHistory([]);
    setQuizSessionId((prev) => prev + 1);
  };

  // Keyboard shortcuts during quiz mode
  useEffect(() => {
    if (currentMode !== "quiz" || quizQuestions.length === 0 || quizFinished) return;

    const handleQuizKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (!quizSubmitted) {
        // Press 1 or A -> option 0
        if (e.key === "1" || e.key === "a" || e.key === "A") {
          e.preventDefault();
          if (quizOptions[0]) handleSelectQuizOption(quizOptions[0]);
        } else if (e.key === "2" || e.key === "b" || e.key === "B") {
          e.preventDefault();
          if (quizOptions[1]) handleSelectQuizOption(quizOptions[1]);
        } else if (e.key === "3" || e.key === "c" || e.key === "C") {
          e.preventDefault();
          if (quizOptions[2]) handleSelectQuizOption(quizOptions[2]);
        } else if (e.key === "4" || e.key === "d" || e.key === "D") {
          e.preventDefault();
          if (quizOptions[3]) handleSelectQuizOption(quizOptions[3]);
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          if (currentQuizQuestion) {
            speakWord(currentQuizQuestion.prompt);
          }
        }
      } else {
        // After submitted, Enter or Space goes to next question
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuizQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleQuizKeyDown);
    return () => window.removeEventListener("keydown", handleQuizKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, quizQuestions, quizFinished, quizSubmitted, quizOptions, currentQuizQuestion]);

  // TYPING LOGIC
  const currentTypingWord = words[typingIndex];
  const handleCheckTyping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTypingWord || !typingInput.trim()) return;
    const isCorrect =
      typingInput.trim().toLowerCase() === currentTypingWord.source.trim().toLowerCase();

    if (isCorrect) {
      playSound("correct");
      setTypingResult("correct");
      if (collectionName) {
        recordReview(collectionName, currentTypingWord.id, true);
      }
      setTimeout(() => {
        if (typingIndex < words.length - 1) {
          setTypingIndex((prev) => prev + 1);
          setTypingInput("");
          setTypingResult("idle");
          setShowTypingHint(false);
        } else {
          alert("Tuyệt vời! Bạn đã hoàn thành toàn bộ bài gõ từ!");
          setTypingIndex(0);
          setTypingInput("");
          setTypingResult("idle");
        }
      }, 900);
    } else {
      playSound("wrong");
      setTypingResult("wrong");
      if (collectionName) {
        recordReview(collectionName, currentTypingWord.id, false);
      }
    }
  };

  if (!selectedCollection) {
    return (
      <Container>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h2>Không tìm thấy bộ sưu tập</h2>
          <p>Bộ thẻ này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
          <Link to="/collections">
            <MyButton variant="primary">Quay lại danh sách</MyButton>
          </Link>
        </div>
      </Container>
    );
  }

  const currentWord = displayWords[currentIndex];

  return (
    <Container>
      {/* HEADER SECTION */}
      <PageHeader>
        <HeaderTop>
          <TitleArea>
            <Link to="/collections" className="back-btn" title="Quay lại">
              <MdArrowBack />
            </Link>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px 10px", flexWrap: "wrap", minWidth: 0 }}>
              <h1>{selectedCollection.name}</h1>
              <span className="cat-badge">{selectedCollection.category || "Tổng hợp"}</span>
              <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                {words.length} thẻ • {words.filter((w) => w.status === "mastered").length} đã thạo
              </span>
            </div>
          </TitleArea>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            {shareMessage && <span style={{ fontSize: 12, color: "#059669" }}>{shareMessage}</span>}
            <MyButton
              variant="primary"
              size="sm"
              icon={<AiOutlinePlus />}
              onClick={() => setShowAddSingleModal(true)}
              title="Thêm từ mới"
            >
              <span className="lbl">Thêm từ mới</span>
            </MyButton>
            <ActionMenu
              items={[
                { label: "Nhập hàng loạt / CSV / Anki", icon: <MdViewModule />, onClick: () => setShowBulkModal(true) },
                { label: "Gợi ý từ phổ biến (offline)", icon: <MdOutlineLightbulb />, onClick: () => setShowSuggestWords(true) },
                // Dimmed until an API key is set; clicking then explains and offers to add one
                {
                  label: `Tạo thẻ bằng AI${aiReady ? "" : " 🔒"}`,
                  icon: <MdAutoAwesome />,
                  dim: !aiReady,
                  title: aiReady ? "Dùng AI tạo thẻ từ chủ đề hoặc đoạn văn" : "Cần nhập API key AI để dùng tính năng này",
                  onClick: () => setShowAIGenerate(true)
                },
                {
                  label: `Đoạn văn ôn từ${aiReady ? "" : " 🔒"}`,
                  icon: <MdAutoAwesome />,
                  dim: !aiReady,
                  title: aiReady ? "AI viết đoạn văn dùng các từ bạn hay sai" : "Cần nhập API key AI để dùng tính năng này",
                  onClick: () => setShowAIStory(true)
                },
                {
                  label: "Xuất CSV",
                  icon: <MdTableRows />,
                  dividerBefore: true,
                  onClick: () =>
                    downloadTextFile(collectionToCsv(selectedCollection.words), `${safeFileName(selectedCollection)}.csv`, "text/csv;charset=utf-8")
                },
                {
                  label: "Chia sẻ bộ thẻ (sao chép link)",
                  icon: <MdOutlineSwapHoriz />,
                  onClick: async () => {
                    try {
                      const url = await buildShareUrl(selectedCollection);
                      await navigator.clipboard.writeText(url);
                      setShareMessage("Đã sao chép liên kết chia sẻ!");
                    } catch {
                      setShareMessage("Không sao chép được liên kết, hãy thử lại.");
                    }
                    setTimeout(() => setShareMessage(null), 3000);
                  }
                }
              ]}
            />
          </div>
        </HeaderTop>

      </PageHeader>

      {/* STUDY MODE TABS: the only sticky part of the header */}
      <StickyTabs>
        <ModeTabs>
          <ModeTab $active={currentMode === "card"} onClick={() => setMode("card")}>
            <IoFlashOutline /> Thẻ Flashcard
          </ModeTab>
          <ModeTab $active={currentMode === "quiz"} onClick={() => setMode("quiz")}>
            <MdQuiz /> Trắc nghiệm ({words.length})
          </ModeTab>
          <ModeTab $active={currentMode === "typing"} onClick={() => setMode("typing")}>
            <MdKeyboardAlt /> Gõ chính tả
          </ModeTab>
          <ModeTab $active={currentMode === "dictation"} onClick={() => setMode("dictation")}>
            <MdVolumeUp /> Nghe chép
          </ModeTab>
          <ModeTab $active={currentMode === "cloze"} onClick={() => setMode("cloze")}>
            <MdKeyboardAlt /> Điền từ
          </ModeTab>
          <ModeTab $active={currentMode === "speaking"} onClick={() => setMode("speaking")}>
            <MdMic /> Luyện nói
          </ModeTab>
          <ModeTab
            $active={currentMode === "sentence"}
            onClick={() => setMode("sentence")}
            style={{ opacity: aiReady ? 1 : 0.5 }}
            title={aiReady ? undefined : "Cần nhập API key AI để dùng tính năng này"}
          >
            <MdAutoAwesome /> Đặt câu (AI){aiReady ? "" : " 🔒"}
          </ModeTab>
          <ModeTab $active={currentMode === "match"} onClick={() => setMode("match")}>
            <MdViewModule /> Ghép cặp
          </ModeTab>
          <ModeTab $active={currentMode === "grid"} onClick={() => setMode("grid")}>
            <MdViewModule /> Lưới thẻ
          </ModeTab>
          <ModeTab $active={currentMode === "table"} onClick={() => setMode("table")}>
            <MdTableRows /> Quản lý danh sách
          </ModeTab>
        </ModeTabs>
      </StickyTabs>

      {/* 1. FLASHCARD MODE */}
      {currentMode === "card" && (
        <StudyWrapper>
          {words.length === 0 ? (
            <CompletionCelebration>
              <h3>Bộ sưu tập chưa có thẻ nào</h3>
              <p>Hãy thêm các thẻ từ vựng đầu tiên để bắt đầu học ngay bây giờ!</p>
              <MyButton
                variant="primary"
                icon={<AiOutlinePlus />}
                onClick={() => setShowAddSingleModal(true)}
              >
                Thêm từ vựng ngay
              </MyButton>
            </CompletionCelebration>
          ) : isCompletedSession ? (
            <CompletionCelebration>
              <div className="trophy">🏆</div>
              <h2>Xuất sắc! Bạn đã ôn hết các thẻ!</h2>
              <p>
                Bạn đã hoàn thành lượt học cho {displayWords.length} thẻ trong bộ sưu tập này. Việc ôn lại thường xuyên sẽ giúp khắc sâu vào trí nhớ dài hạn!
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <MyButton
                  variant="primary"
                  onClick={() => {
                    setCurrentIndex(0);
                    setIsCompletedSession(false);
                  }}
                >
                  Học lại từ đầu
                </MyButton>
                <MyButton
                  variant="secondary"
                  onClick={() => setMode("quiz")}
                >
                  Thử thách trắc nghiệm
                </MyButton>
              </div>
            </CompletionCelebration>
          ) : (
            <>
              {/* Study Toolbar */}
              <StudyToolBar>
                <FilterChips>
                  <FilterChip
                    $active={filterType === "all"}
                    onClick={() => setFilterType("all")}
                  >
                    Tất cả ({words.length})
                  </FilterChip>
                  <FilterChip
                    $active={filterType === "starred"}
                    onClick={() => setFilterType("starred")}
                  >
                    ⭐ Yêu thích ({words.filter((w) => w.starred).length})
                  </FilterChip>
                  <FilterChip
                    $active={filterType === "learning"}
                    onClick={() => setFilterType("learning")}
                  >
                    Cần ôn ({words.filter((w) => w.status !== "mastered").length})
                  </FilterChip>
                </FilterChips>

                <div style={{ display: "flex", gap: "6px" }}>
                  <MyButton
                    variant="ghost"
                    size="sm"
                    icon={<MdOutlineSwapHoriz />}
                    onClick={() => setIsReverseMode(!isReverseMode)}
                    title={isReverseMode ? "Đang hiện: Định nghĩa trước" : "Đang hiện: Thuật ngữ trước"}
                  >
                    {isReverseMode ? "Nghĩa → Từ" : "Từ → Nghĩa"}
                  </MyButton>

                  <MyButton
                    variant={isShuffled ? "primary" : "ghost"}
                    size="sm"
                    icon={<MdOutlineShuffle />}
                    onClick={handleToggleShuffle}
                    title="Xáo trộn ngẫu nhiên"
                  >
                    Trộn thẻ
                  </MyButton>

                  <MyButton
                    variant={isAutoPlay ? "primary" : "ghost"}
                    size="sm"
                    icon={isAutoPlay ? <MdPause /> : <MdPlayArrow />}
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    title="Tự động lật và chuyển thẻ sau 4s"
                  >
                    {isAutoPlay ? "Dừng" : "Tự chạy"}
                  </MyButton>
                </div>
              </StudyToolBar>

              {/* Central Flashcard */}
              {currentWord && (
                <div style={{ width: "100%" }}>
                  <FlipCard
                    key={`${currentWord.id}-${isReverseMode}`}
                    front={isReverseMode ? currentWord.target : currentWord.source}
                    back={isReverseMode ? currentWord.source : currentWord.target}
                    phonetic={isReverseMode ? undefined : currentWord.phonetic}
                    autoSpeak={settings.autoSpeak && !isReverseMode}
                    example={currentWord.example}
                    image={currentWord.image}
                    mnemonic={currentWord.mnemonic}
                    status={currentWord.status}
                    starred={currentWord.starred}
                    onToggleStar={() => toggleStar(selectedCollection.pathname, currentWord.id)}
                    height="clamp(220px, 44vh, 400px)"
                  />
                </div>
              )}

              {/* Card Controls & Rating */}
              <StickyStudyFooter>
                <CardControlRow>
                  <MyButton
                    variant="secondary"
                    size="md"
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                  >
                    ← Thẻ trước
                  </MyButton>

                  <NavigationCounter>
                    Thẻ {currentIndex + 1} / {displayWords.length}
                  </NavigationCounter>

                  <MyButton
                    variant="primary"
                    size="md"
                    onClick={handleNextCard}
                  >
                    Thẻ sau →
                  </MyButton>
                </CardControlRow>

                {/* Spaced Repetition Rating Buttons */}
                <RatingBar>
                  <RateButton
                    $color="#ef4444"
                    onClick={() => handleRateCard("learning", 0)}
                    title="Bấm phím 1"
                  >
                    <span>Chưa nhớ</span>
                    <span className="key-hint">Phím 1</span>
                  </RateButton>

                  <RateButton
                    $color="#f59e0b"
                    onClick={() => handleRateCard("learning", 1)}
                    title="Bấm phím 2"
                  >
                    <span>Đang học</span>
                    <span className="key-hint">Phím 2</span>
                  </RateButton>

                  <RateButton
                    $color="#10b981"
                    onClick={() => handleRateCard("mastered", 3)}
                    title="Bấm phím 3"
                  >
                    <span>Đã thuộc làu</span>
                    <span className="key-hint">Phím 3</span>
                  </RateButton>
                </RatingBar>
              </StickyStudyFooter>
            </>
          )}
        </StudyWrapper>
      )}

      {/* 2. QUIZ MODE */}
      {currentMode === "quiz" && (
        <QuizContainer>
          {words.length === 0 ? (
            <CompletionCelebration>
              <h3>Chưa có thẻ từ vựng</h3>
              <p>Hãy thêm thẻ từ vựng để bắt đầu thử thách trắc nghiệm.</p>
              <MyButton variant="primary" onClick={() => setShowAddSingleModal(true)}>
                Thêm từ vựng ngay
              </MyButton>
            </CompletionCelebration>
          ) : quizFinished ? (
            <CompletionCelebration>
              <div className="trophy">🎯</div>
              <h2>Hoàn thành bài trắc nghiệm!</h2>
              <p>
                Kết quả: <strong>{quizScore} / {quizQuestions.length} câu đúng</strong> ({Math.round((quizScore / quizQuestions.length) * 100) || 0}%)
              </p>
              <div style={{ marginTop: "4px" }}>
                {quizScore === quizQuestions.length ? (
                  <QuizInfoBadge>🌟 Tuyệt đối 100%! Bạn đã làm chủ hoàn toàn các từ này!</QuizInfoBadge>
                ) : quizScore >= Math.ceil(quizQuestions.length * 0.7) ? (
                  <QuizInfoBadge>👏 Rất tốt! Bạn nhớ được hầu hết từ vựng!</QuizInfoBadge>
                ) : (
                  <span style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 700 }}>
                    💪 Hãy ôn tập thêm và thử lại nhé!
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                <MyButton
                  variant="primary"
                  icon={<MdRestartAlt />}
                  onClick={() => handleRestartQuiz(true)}
                  title="Tạo bộ đề mới với 4 đáp án được xáo trộn ngẫu nhiên"
                >
                  Làm lại (Đề mới & 4 đáp án mới)
                </MyButton>

                {quizHistory.some((h) => !h.isCorrect) && (
                  <MyButton
                    variant="danger"
                    onClick={handleRetryWrongQuestions}
                    title="Chỉ thi lại những câu đã trả lời sai"
                  >
                    Luyện lại {quizHistory.filter((h) => !h.isCorrect).length} câu sai
                  </MyButton>
                )}

                <MyButton variant="secondary" onClick={() => setMode("card")}>
                  Quay lại Flashcard
                </MyButton>
              </div>

              {/* Detailed review of answers */}
              {quizHistory.length > 0 && (
                <div style={{ width: "100%", marginTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      Chi tiết đáp án từng câu ({quizHistory.length} câu):
                    </h4>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {quizScore} đúng / {quizHistory.filter((h) => !h.isCorrect).length} sai
                    </span>
                  </div>

                  <QuizSummaryReview>
                    {quizHistory.map((item, idx) => (
                      <QuizReviewItem key={idx} $isCorrect={item.isCorrect}>
                        <div>
                          <div className="review-prompt">
                            Câu {idx + 1}: {item.prompt}
                            {item.phonetic && (
                              <span style={{ fontSize: "13px", fontWeight: 500, color: "#3b82f6", marginLeft: "8px" }}>
                                {item.phonetic}
                              </span>
                            )}
                          </div>
                          <div className="review-ans">
                            {item.isCorrect ? (
                              <span className="review-correct">✓ Bạn chọn đúng: {item.correctAnswer}</span>
                            ) : (
                              <>
                                <span className="review-wrong">✗ Bạn chọn: {item.selectedOption}</span>
                                <span className="review-correct">✓ Đáp án đúng: {item.correctAnswer}</span>
                              </>
                            )}
                          </div>
                          {item.example && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>
                              💡 Ví dụ: {item.example}
                            </div>
                          )}
                        </div>
                        <div>
                          {item.isCorrect ? (
                            <span style={{ color: "#10b981", fontWeight: 800, fontSize: "18px" }}>✓</span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "18px" }}>✗</span>
                          )}
                        </div>
                      </QuizReviewItem>
                    ))}
                  </QuizSummaryReview>
                </div>
              )}
            </CompletionCelebration>
          ) : currentQuizQuestion ? (
            <>
              {/* Quiz Control Toolbar */}
              <QuizToolbar>
                <QuizToolbarGroup>
                  <QuizPillButton
                    $active={quizShuffleQuestions}
                    onClick={() => {
                      setQuizShuffleQuestions(!quizShuffleQuestions);
                      setQuizSessionId((prev) => prev + 1);
                    }}
                    title="Bật/Tắt xáo trộn thứ tự các câu hỏi"
                  >
                    <MdOutlineShuffle /> {quizShuffleQuestions ? "Xáo câu: Bật" : "Xáo câu: Tắt"}
                  </QuizPillButton>

                  <QuizPillButton
                    $active={quizReverseMode}
                    onClick={() => {
                      setQuizReverseMode(!quizReverseMode);
                      setQuizSessionId((prev) => prev + 1);
                    }}
                    title="Đổi chiều câu hỏi (Hỏi từ chọn nghĩa hoặc hỏi nghĩa chọn từ)"
                  >
                    <MdOutlineSwapHoriz /> {quizReverseMode ? "Hỏi: Nghĩa ➔ Chọn: Từ" : "Hỏi: Từ ➔ Chọn: Nghĩa"}
                  </QuizPillButton>

                  {retryOnlyWordIds && (
                    <QuizPillButton onClick={() => handleRestartQuiz(true)} title="Xem lại toàn bộ bộ từ">
                      <MdRestartAlt /> Đang luyện lại câu sai (Hủy)
                    </QuizPillButton>
                  )}
                </QuizToolbarGroup>

                <QuizInfoBadge title="Hệ thống tự động lấy ngẫu nhiên 4 đáp án phân biệt từ các từ trong bộ sưu tập">
                  🎲 4 đáp án ngẫu nhiên
                </QuizInfoBadge>
              </QuizToolbar>

              {/* Progress bar */}
              <QuizProgressBar>
                <div
                  className="fill"
                  style={{
                    width: `${Math.round(((quizIndex + (quizSubmitted ? 1 : 0)) / quizQuestions.length) * 100)}%`
                  }}
                />
              </QuizProgressBar>

              <QuizCard>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span className="quiz-q-label">
                    Câu hỏi {quizIndex + 1} / {quizQuestions.length}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#10b981" }}>
                      Đúng: {quizScore} / {quizQuestions.length}
                    </span>
                    <button
                      onClick={() => handleRestartQuiz(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}
                      title="Làm lại từ đầu"
                    >
                      <MdRestartAlt size={16} /> Làm lại
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="quiz-term">{currentQuizQuestion.prompt}</h3>
                  {currentQuizQuestion.phonetic && (
                    <div style={{ color: "#3b82f6", fontSize: "15px", marginTop: "4px", fontWeight: 600 }}>
                      {currentQuizQuestion.phonetic}
                    </div>
                  )}
                  <div style={{ marginTop: "8px" }}>
                    <MyButton
                      variant="ghost"
                      size="sm"
                      icon={isSpeakLoading("quiz") ? <SpeakSpinner /> : <MdVolumeUp />}
                      onClick={() => speak("quiz", currentQuizQuestion.prompt)}
                      title="Bấm phím R để nghe lại phát âm"
                    >
                      Nghe phát âm (Phím R)
                    </MyButton>
                  </div>
                </div>

                {/* Always exactly 4 randomized options from collection */}
                <QuizOptionsGrid>
                  {quizOptions.map((option, idx) => {
                    const isSelected = quizSelectedOption === option;
                    const isCorrect = option.trim().toLowerCase() === currentQuizQuestion.correctAnswer.trim().toLowerCase();
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const numberKey = idx + 1; // 1, 2, 3, 4

                    return (
                      <OptionButton
                        key={`${quizIndex}-${idx}`}
                        $isSelected={isSelected}
                        $isCorrect={isCorrect}
                        $showResult={quizSubmitted}
                        onClick={() => handleSelectQuizOption(option)}
                        disabled={quizSubmitted}
                        title={`Bấm phím ${numberKey} hoặc ${letter}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              background: isSelected
                                ? "var(--accent-primary, #3b82f6)"
                                : quizSubmitted && isCorrect
                                ? "#10b981"
                                : "var(--bg-tertiary, #f1f5f9)",
                              color: isSelected || (quizSubmitted && isCorrect)
                                ? "white"
                                : "var(--text-secondary, #475569)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {letter}
                          </span>
                          <span style={{ fontSize: "15px" }}>{option}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--text-muted, #94a3b8)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "rgba(0,0,0,0.04)"
                            }}
                          >
                            Phím {numberKey}
                          </span>
                          {quizSubmitted && isCorrect && <MdCheck size={22} color="#10b981" />}
                          {quizSubmitted && isSelected && !isCorrect && <MdClose size={22} color="#ef4444" />}
                        </div>
                      </OptionButton>
                    );
                  })}
                </QuizOptionsGrid>

                {/* Explanation and Next question button */}
                {quizSubmitted && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                    {currentQuizQuestion.example && (
                      <QuizExampleBox>
                        <div className="example-label">💡 Câu ví dụ ngữ cảnh:</div>
                        <div className="example-text">{currentQuizQuestion.example}</div>
                      </QuizExampleBox>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        💡 Mẹo: Nhấn <strong>Enter</strong> hoặc <strong>Phím cách</strong> để sang câu tiếp theo
                      </span>
                      <MyButton variant="primary" size="lg" onClick={handleNextQuizQuestion}>
                        {quizIndex < quizQuestions.length - 1 ? "Câu tiếp theo →" : "Xem kết quả →"}
                      </MyButton>
                    </div>
                  </div>
                )}
              </QuizCard>
            </>
          ) : null}
        </QuizContainer>
      )}

      {/* 3. TYPING PRACTICE MODE */}
      {currentMode === "typing" && (
        <TypingContainer>
          {words.length === 0 ? (
            <CompletionCelebration>
              <h3>Chưa có thẻ nào</h3>
              <p>Hãy thêm thẻ để bắt đầu luyện gõ từ vựng.</p>
            </CompletionCelebration>
          ) : currentTypingWord ? (
            <TypingCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Từ {typingIndex + 1} / {words.length}
                </span>
                <MyButton
                  variant="ghost"
                  size="sm"
                  icon={<MdOutlineLightbulb />}
                  onClick={() => setShowTypingHint(!showTypingHint)}
                >
                  {showTypingHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                </MyButton>
              </div>

              <div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Nghĩa của từ:</span>
                <h2 style={{ fontSize: "24px", color: "#2563eb", margin: "6px 0 0 0" }}>
                  {currentTypingWord.target}
                </h2>
                {currentTypingWord.example && (
                  <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--text-secondary)", marginTop: "8px" }}>
                    Ví dụ: "{currentTypingWord.example}"
                  </p>
                )}
              </div>

              {showTypingHint && (
                <div style={{ padding: "8px 12px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", fontSize: "13px" }}>
                  Gợi ý: Ký tự đầu là "<strong>{currentTypingWord.source[0]}</strong>", gồm {currentTypingWord.source.length} ký tự.
                </div>
              )}

              <form onSubmit={handleCheckTyping} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <MyInput
                  placeholder="Gõ từ chính xác vào đây..."
                  value={typingInput}
                  onChange={(e) => {
                    setTypingInput(e.target.value);
                    setTypingResult("idle");
                  }}
                  hasError={typingResult === "wrong"}
                  autoFocus
                />

                {typingResult === "correct" && (
                  <div style={{ color: "#10b981", fontWeight: 700, fontSize: "14px" }}>
                    ✓ Chính xác! Rất tốt!
                  </div>
                )}
                {typingResult === "wrong" && (
                  <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "14px" }}>
                    ✗ Chưa chính xác. Đáp án đúng là: <strong>{currentTypingWord.source}</strong>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <MyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (typingIndex < words.length - 1) {
                        setTypingIndex((prev) => prev + 1);
                        setTypingInput("");
                        setTypingResult("idle");
                        setShowTypingHint(false);
                      }
                    }}
                  >
                    Bỏ qua từ này
                  </MyButton>
                  <MyButton variant="primary" type="submit">
                    Kiểm tra (Enter)
                  </MyButton>
                </div>
              </form>
            </TypingCard>
          ) : null}
        </TypingContainer>
      )}

      {/* 4. GRID VIEW */}
      {currentMode === "dictation" && (
        <Dictation
          words={words}
          speechRate={settings.speechRate}
          onAnswer={(id, ok) => collectionName && recordReview(collectionName, id, ok)}
        />
      )}
      {currentMode === "cloze" && (
        <Cloze words={words} onAnswer={(id, ok) => collectionName && recordReview(collectionName, id, ok)} />
      )}
      {currentMode === "speaking" && (
        <Speaking
          words={words}
          speechRate={settings.speechRate}
          onAnswer={(id, ok) => collectionName && recordReview(collectionName, id, ok)}
        />
      )}
      {currentMode === "sentence" && (
        <SentencePractice words={words} onAnswer={(id, ok) => collectionName && recordReview(collectionName, id, ok)} />
      )}
      {currentMode === "match" && (
        <Matching words={words} onAnswer={(id, ok) => collectionName && recordReview(collectionName, id, ok)} />
      )}

      {currentMode === "grid" && (
        <WordGrid>
          {words.map((word) => (
            <FlipCard
              key={word.id}
              front={word.source}
              back={word.target}
              phonetic={word.phonetic}
              example={word.example}
              image={word.image}
              mnemonic={word.mnemonic}
              status={word.status}
              starred={word.starred}
              onToggleStar={() => toggleStar(selectedCollection.pathname, word.id)}
              height="260px"
              compact={true}
            />
          ))}
        </WordGrid>
      )}

      {/* 5. TABLE / MANAGEMENT MODE */}
      {currentMode === "table" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "340px", width: "100%" }}>
              <MyInput
                placeholder="Tìm từ vựng trong bảng..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            {duplicateIds.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  padding: "6px 12px",
                  borderRadius: 10,
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#b45309",
                  fontSize: 13
                }}
              >
                <span>Có {duplicateIds.length} thẻ trùng mặt trước</span>
                <MyButton variant="outline" size="sm" onClick={handleRemoveDuplicates}>
                  Xóa bản sao
                </MyButton>
              </div>
            )}
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Hiển thị: {words.filter((w) => w.source.toLowerCase().includes(tableSearch.toLowerCase()) || w.target.toLowerCase().includes(tableSearch.toLowerCase())).length} / {words.length} thẻ
            </div>
          </div>

          <DesktopTableContainer>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th>Thuật ngữ (Mặt trước)</th>
                    <th>Phiên âm</th>
                    <th>Định nghĩa (Mặt sau)</th>
                    <th>Ví dụ</th>
                    <th style={{ width: "120px", minWidth: "120px", whiteSpace: "nowrap" }}>Trạng thái</th>
                    <th style={{ width: "100px", minWidth: "100px", textAlign: "right", whiteSpace: "nowrap" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {words
                    .filter((w) =>
                      w.source.toLowerCase().includes(tableSearch.toLowerCase()) ||
                      w.target.toLowerCase().includes(tableSearch.toLowerCase())
                    )
                    .map((word, idx) => (
                      <tr key={word.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                            <button
                              onClick={() => toggleStar(selectedCollection.pathname, word.id)}
                              style={{ color: word.starred ? "#f59e0b" : "#cbd5e1", fontSize: "16px" }}
                            >
                              {word.starred ? <AiFillStar /> : <AiOutlineStar />}
                            </button>
                            <span>{word.source}</span>
                            <button
                              onClick={() => speak(`word-${word.id}`, word.source)}
                              style={{ color: "#3b82f6", fontSize: "16px" }}
                              title="Nghe phát âm"
                            >
                              {isSpeakLoading(`word-${word.id}`) ? <SpeakSpinner /> : <MdVolumeUp />}
                            </button>
                          </div>
                        </td>
                        <td style={{ color: "#3b82f6", fontFamily: "monospace" }}>{word.phonetic || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{word.target}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {word.example ? `"${word.example}"` : "—"}
                        </td>
                        <td style={{ width: "120px", whiteSpace: "nowrap" }}>
                          <StatusBadge $status={word.status}>
                            {word.status === "mastered" ? "Đã thuộc" : word.status === "learning" ? "Đang học" : "Chưa ôn"}
                          </StatusBadge>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "4px" }}>
                            <MyButton
                              variant="ghost"
                              size="sm"
                              icon={<AiOutlineEdit />}
                              onClick={() => {
                                setEditingWord(word);
                                setShowEditModal(true);
                              }}
                              title="Sửa từ"
                            />
                            <MyButton
                              variant="ghost"
                              size="sm"
                              icon={<AiOutlineDelete />}
                              onClick={() => {
                                if (window.confirm(`Bạn muốn xóa thẻ "${word.source}"?`)) {
                                  deleteWord(selectedCollection.pathname, word.id);
                                }
                              }}
                              title="Xóa thẻ"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </TableWrapper>
          </DesktopTableContainer>

          {/* MOBILE WORD CARDS LIST */}
          <MobileCardList>
            {words
              .filter((w) =>
                w.source.toLowerCase().includes(tableSearch.toLowerCase()) ||
                w.target.toLowerCase().includes(tableSearch.toLowerCase())
              )
              .map((word) => (
                <MobileWordCard key={word.id}>
                  <div className="card-top">
                    <div className="word-head">
                      <button
                        onClick={() => toggleStar(selectedCollection.pathname, word.id)}
                        style={{ color: word.starred ? "#f59e0b" : "#cbd5e1", fontSize: "18px", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        {word.starred ? <AiFillStar /> : <AiOutlineStar />}
                      </button>
                      <span className="term">{word.source}</span>
                      {word.phonetic && <span className="phonetic">{word.phonetic}</span>}
                    </div>

                    <button
                      onClick={() => speak(`word-${word.id}`, word.source)}
                      style={{ color: "#3b82f6", fontSize: "18px", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      title="Nghe phát âm"
                    >
                      {isSpeakLoading(`word-${word.id}`) ? <SpeakSpinner /> : <MdVolumeUp />}
                    </button>
                  </div>

                  <p className="def">{word.target}</p>

                  {word.example && <p className="example">"{word.example}"</p>}

                  <div className="card-bottom">
                    <StatusBadge $status={word.status}>
                      {word.status === "mastered" ? "Đã thuộc" : word.status === "learning" ? "Đang học" : "Chưa ôn"}
                    </StatusBadge>

                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <MyButton
                        variant="ghost"
                        size="sm"
                        icon={<AiOutlineEdit />}
                        onClick={() => {
                          setEditingWord(word);
                          setShowEditModal(true);
                        }}
                        title="Sửa từ"
                      />
                      <MyButton
                        variant="ghost"
                        size="sm"
                        icon={<AiOutlineDelete />}
                        onClick={() => {
                          if (window.confirm(`Bạn muốn xóa thẻ "${word.source}"?`)) {
                            deleteWord(selectedCollection.pathname, word.id);
                          }
                        }}
                        title="Xóa thẻ"
                      />
                    </div>
                  </div>
                </MobileWordCard>
              ))}
          </MobileCardList>
        </div>
      )}

      {/* MODAL: ADD SINGLE WORD */}
      {showAddSingleModal && (
        <MyModal
          title="Thêm thẻ từ vựng mới"
          onClose={() => setShowAddSingleModal(false)}
        >
          <form onSubmit={handleAddSingleWord} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mặt trước (Từ vựng / Câu hỏi) *
              </label>
              <MyInput
                placeholder="VD: Delicious"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                autoFocus
              />
              <WordSuggest
                text={newSource}
                onPick={(p) => {
                  setNewSource(p.word);
                  if (p.ipa && !newPhonetic.trim()) setNewPhonetic(p.ipa);
                  if (p.example && !newExample.trim()) setNewExample(p.example);
                  if ((p.vi || p.definition) && !newTarget.trim()) setNewTarget(p.vi || p.definition);
                }}
              />
              <div style={{ marginTop: 8 }}>
                <AutoFillButton
                  word={newSource}
                  onResult={(r: LookupResult) => {
                    if (r.translation && !newTarget.trim()) setNewTarget(r.translation);
                    if (r.phonetic && !newPhonetic.trim()) setNewPhonetic(r.phonetic);
                    if (r.example && !newExample.trim()) setNewExample(r.example);
                  }}
                />
                <div style={{ marginTop: 6 }}>
                  <AIEnrichButton
                    word={newSource}
                    meaning={newTarget}
                    onResult={(r: LookupResult) => {
                      if (r.translation && !newTarget.trim()) setNewTarget(r.translation);
                      if (r.phonetic && !newPhonetic.trim()) setNewPhonetic(r.phonetic);
                      if (r.example && !newExample.trim()) setNewExample(r.example);
                      if (r.mnemonic && !newMnemonic.trim()) setNewMnemonic(r.mnemonic);
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mặt sau (Định nghĩa / Dịch nghĩa) *
              </label>
              <MyInput
                placeholder="VD: Ngon miệng"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Phiên âm IPA (tùy chọn)
              </label>
              <MyInput
                placeholder="VD: /dɪˈlɪʃ.əs/"
                value={newPhonetic}
                onChange={(e) => setNewPhonetic(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Ví dụ minh họa (tùy chọn)
              </label>
              <MyTextarea
                placeholder="VD: The food at this restaurant is delicious!"
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mẹo ghi nhớ (tùy chọn)
              </label>
              <MyInput
                placeholder="VD: nghe giống 'đi lít sơ' → ngon"
                value={newMnemonic}
                onChange={(e) => setNewMnemonic(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Link hình ảnh minh họa (tùy chọn)
              </label>
              <MyInput
                placeholder="https://..."
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <MyButton variant="ghost" onClick={() => setShowAddSingleModal(false)}>
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit" disabled={!newSource.trim() || !newTarget.trim()}>
                Thêm vào bộ thẻ
              </MyButton>
            </div>
          </form>
        </MyModal>
      )}

      {showAIGenerate && (
        <AIGenerateModal
          existingSources={words.map((w) => w.source)}
          onClose={() => setShowAIGenerate(false)}
          onAdd={(list) => {
            if (!collectionName) return;
            // addWord prepends, so add in reverse to keep the AI's order
            [...list].reverse().forEach((w) => addWord(collectionName, w));
          }}
        />
      )}

      {showSuggestWords && (
        <SuggestWordsModal
          existingSources={words.map((w) => w.source)}
          onClose={() => setShowSuggestWords(false)}
          onAdd={(list) => {
            if (!collectionName) return;
            [...list].reverse().forEach((w) => addWord(collectionName, w));
          }}
        />
      )}
      {showAIStory && <AIStoryModal words={words} onClose={() => setShowAIStory(false)} />}

      {/* MODAL: BULK IMPORT WORDS */}
      {showBulkModal && (
        <MyModal
          title="Nhập từ vựng hàng loạt (Bulk Import)"
          onClose={() => setShowBulkModal(false)}
          maxWidth="600px"
        >
          <form onSubmit={handleBulkImport} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
              Dán danh sách từ vựng theo cấu trúc mỗi dòng một thẻ: <code>Từ vựng - Định nghĩa - Ví dụ</code> hoặc <code>Từ vựng : Định nghĩa</code>
            </p>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Hoặc chọn tệp CSV / TSV / Anki (.txt) — nội dung sẽ hiện bên dưới để bạn kiểm tra trước khi nạp
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const converted = csvToBulkText(String(ev.target?.result || ""));
                    setBulkText((prev) => (prev.trim() ? prev.trimEnd() + "\n" : "") + converted);
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </div>

            <MyTextarea
              style={{ minHeight: "180px", fontFamily: "monospace", fontSize: "13px" }}
              placeholder={`Apple - Quả táo - I eat an apple daily\nBanana - Quả chuối\nCat - Con mèo\nDog - Con chó`}
              value={bulkText}
              onChange={(e) => {
                setBulkText(e.target.value);
                setBulkFillNote(null);
              }}
              autoFocus
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <MyButton variant="outline" size="sm" onClick={handleBulkAutoFill} disabled={!bulkText.trim()}>
                Tự điền nghĩa từ từ điển
              </MyButton>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {bulkFillNote || "Dòng chỉ có một từ tiếng Anh sẽ được điền nghĩa tiếng Việt và ví dụ (offline)."}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <MyButton variant="ghost" onClick={() => setShowBulkModal(false)}>
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit" disabled={!bulkText.trim()}>
                Nạp từ vựng vào bộ thẻ
              </MyButton>
            </div>
          </form>
        </MyModal>
      )}

      {/* MODAL: EDIT WORD */}
      {showEditModal && editingWord && (
        <MyModal
          title="Chỉnh sửa thẻ từ vựng"
          onClose={() => {
            setShowEditModal(false);
            setEditingWord(null);
          }}
        >
          <form onSubmit={handleSaveEditWord} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mặt trước (Thuật ngữ) *
              </label>
              <MyInput
                value={editingWord.source}
                onChange={(e) => setEditingWord({ ...editingWord, source: e.target.value })}
                autoFocus
              />
              <WordSuggest
                text={editingWord.source}
                onPick={(p) =>
                  setEditingWord((prev) =>
                    prev
                      ? {
                          ...prev,
                          source: p.word,
                          phonetic: prev.phonetic?.trim() ? prev.phonetic : p.ipa || prev.phonetic,
                          example: prev.example?.trim() ? prev.example : p.example || prev.example,
                          target: prev.target.trim() ? prev.target : p.vi || p.definition || prev.target
                        }
                      : prev
                  )
                }
              />
              <div style={{ marginTop: 8 }}>
                <AutoFillButton
                  word={editingWord.source}
                  onResult={(r: LookupResult) =>
                    setEditingWord((prev) =>
                      prev
                        ? {
                            ...prev,
                            target: prev.target.trim() ? prev.target : r.translation || prev.target,
                            phonetic: prev.phonetic?.trim() ? prev.phonetic : r.phonetic || prev.phonetic,
                            example: prev.example?.trim() ? prev.example : r.example || prev.example
                          }
                        : prev
                    )
                  }
                />
                <div style={{ marginTop: 6 }}>
                  <AIEnrichButton
                    word={editingWord.source}
                    meaning={editingWord.target}
                    onResult={(r: LookupResult) =>
                      setEditingWord((prev) =>
                        prev
                          ? {
                              ...prev,
                              target: prev.target.trim() ? prev.target : r.translation || prev.target,
                              phonetic: prev.phonetic?.trim() ? prev.phonetic : r.phonetic || prev.phonetic,
                              example: prev.example?.trim() ? prev.example : r.example || prev.example,
                              mnemonic: prev.mnemonic?.trim() ? prev.mnemonic : r.mnemonic || prev.mnemonic
                            }
                          : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mặt sau (Định nghĩa) *
              </label>
              <MyInput
                value={editingWord.target}
                onChange={(e) => setEditingWord({ ...editingWord, target: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Phiên âm
              </label>
              <MyInput
                value={editingWord.phonetic || ""}
                onChange={(e) => setEditingWord({ ...editingWord, phonetic: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Ví dụ
              </label>
              <MyTextarea
                value={editingWord.example || ""}
                onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mẹo ghi nhớ
              </label>
              <MyInput
                value={editingWord.mnemonic || ""}
                onChange={(e) => setEditingWord({ ...editingWord, mnemonic: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Link hình ảnh
              </label>
              <MyInput
                placeholder="https://..."
                value={editingWord.image || ""}
                onChange={(e) => setEditingWord({ ...editingWord, image: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <MyButton
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWord(null);
                }}
              >
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit">
                Lưu thay đổi
              </MyButton>
            </div>
          </form>
        </MyModal>
      )}
    </Container>
  );
}
