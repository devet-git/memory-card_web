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
  MdOutlineLightbulb
} from "react-icons/md";
import { IoFlashOutline } from "react-icons/io5";
import { AiFillStar, AiOutlineStar, AiOutlinePlus, AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import useCollectionContext from "contexts/Collection";
import FlipCard from "components/FlipCard";
import MyButton from "components/MyButton";
import { MyInput, MyTextarea } from "components/MyInput";
import MyModal from "components/MyModal";
import { speakWord } from "utils/speech";
import { playSound } from "utils/sound";
import { WordItem, MasteryStatus } from "types";

type StudyMode = "card" | "quiz" | "typing" | "grid" | "table";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  .back-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary, #f1f5f9);
    color: var(--text-primary, #0f172a);
    font-size: 20px;
    transition: all 0.15s ease;

    &:hover {
      background: var(--border-color, #e2e8f0);
      color: #3b82f6;
    }
  }

  h1 {
    font-size: 22px;
    font-weight: 800;
    margin: 0;
    color: var(--text-primary, #0f172a);
  }

  .cat-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 9999px;
    background-color: rgba(59, 130, 246, 0.12);
    color: #2563eb;
  }
`;

const ModeTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary, #f1f5f9);
  padding: 4px;
  border-radius: 10px;
  overflow-x: auto;
`;

const ModeTab = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background-color: ${(props) => (props.active ? "var(--bg-card, #ffffff)" : "transparent")};
  color: ${(props) => (props.active ? "var(--accent-primary, #3b82f6)" : "var(--text-secondary, #64748b)")};
  box-shadow: ${(props) => (props.active ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none")};
  transition: all 0.15s ease;

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
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
`;

const StudyToolBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterChips = styled.div`
  display: flex;
  gap: 6px;
`;

const FilterChip = styled.button<{ active: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${(props) => (props.active ? "#3b82f6" : "var(--bg-card, #ffffff)")};
  color: ${(props) => (props.active ? "#ffffff" : "var(--text-secondary, #64748b)")};
  border: 1px solid ${(props) => (props.active ? "#3b82f6" : "var(--border-color, #e2e8f0)")};
  transition: all 0.15s ease;
`;

const CardControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
`;

const NavigationCounter = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary, #64748b);
`;

const RatingBar = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: center;
  margin-top: 8px;
`;

const RateButton = styled.button<{ color: string }>`
  flex: 1;
  max-width: 180px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-weight: 700;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.05));
  transition: all 0.15s ease;

  .key-hint {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted, #94a3b8);
  }

  &:hover {
    border-color: ${(props) => props.color};
    color: ${(props) => props.color};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

/* QUIZ STYLES */
const QuizContainer = styled.div`
  max-width: 680px;
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
  padding: 32px 28px;
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;

  .quiz-q-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-primary, #3b82f6);
  }

  .quiz-term {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary, #0f172a);
    margin: 0;
  }
`;

const QuizOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
`;

const OptionButton = styled.button<{
  isSelected: boolean;
  isCorrect?: boolean;
  showResult: boolean;
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

  ${(props) => {
    if (props.showResult) {
      if (props.isCorrect) {
        return `
          border-color: #10b981;
          background-color: rgba(16, 185, 129, 0.12);
          color: #059669;
        `;
      }
      if (props.isSelected && !props.isCorrect) {
        return `
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        `;
      }
    }
    if (props.isSelected) {
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

/* TYPING PRACTICE STYLES */
const TypingContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TypingCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;
`;

/* GRID & TABLE VIEW STYLES */
const WordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const TableWrapper = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;

  th {
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

const CompletionCelebration = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 20px;
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 520px;
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
    bulkImportWords
  } = useCollectionContext();

  const currentMode = (searchParams.get("mode") as StudyMode) || "card";
  const setMode = (mode: StudyMode) => {
    setSearchParams({ mode });
  };

  const selectedCollection = collections.find((c) => c.pathname === collectionName);

  // Modals state
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);

  // New word form state
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newExample, setNewExample] = useState("");
  const [bulkText, setBulkText] = useState("");

  // Search & filter
  const [tableSearch, setTableSearch] = useState("");
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

  // Typing practice state
  const [typingInput, setTypingInput] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingResult, setTypingResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [showTypingHint, setShowTypingHint] = useState(false);

  const words = selectedCollection?.words || [];

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

  const handleRateCard = (status: MasteryStatus) => {
    const currentWord = displayWords[currentIndex];
    if (currentWord && collectionName) {
      updateWordStatus(collectionName, currentWord.id, status);
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
        handleRateCard("learning");
      } else if (e.key === "2") {
        e.preventDefault();
        handleRateCard("learning");
      } else if (e.key === "3") {
        e.preventDefault();
        handleRateCard("mastered");
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
        status: "new",
        starred: false
      });
      setNewSource("");
      setNewTarget("");
      setNewPhonetic("");
      setNewExample("");
      setShowAddSingleModal(false);
    }
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
      example: editingWord.example
    });
    setShowEditModal(false);
    setEditingWord(null);
  };

  // QUIZ LOGIC
  const currentQuizWord = words[quizIndex];
  const quizOptions = useMemo(() => {
    if (!currentQuizWord || words.length < 2) return [];
    const correct = currentQuizWord.target;
    const distractors = words
      .filter((w) => w.id !== currentQuizWord.id)
      .map((w) => w.target)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return [correct, ...distractors].sort(() => 0.5 - Math.random());
  }, [currentQuizWord, words]);

  const handleSelectQuizOption = (option: string) => {
    if (quizSubmitted) return;
    setQuizSelectedOption(option);
    setQuizSubmitted(true);
    const isCorrect = option === currentQuizWord?.target;
    if (isCorrect) {
      playSound("correct");
      setQuizScore((prev) => prev + 1);
      if (collectionName && currentQuizWord) {
        recordReview(collectionName, currentQuizWord.id, true);
      }
    } else {
      playSound("wrong");
      if (collectionName && currentQuizWord) {
        recordReview(collectionName, currentQuizWord.id, false);
      }
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < words.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizSubmitted(false);
    } else {
      setQuizFinished(true);
      playSound("complete");
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizFinished(false);
  };

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
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1>{selectedCollection.name}</h1>
                <span className="cat-badge">{selectedCollection.category || "Tổng hợp"}</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                {words.length} thẻ từ vựng • {words.filter((w) => w.status === "mastered").length} đã thành thạo
              </p>
            </div>
          </TitleArea>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <MyButton
              variant="primary"
              size="sm"
              icon={<AiOutlinePlus />}
              onClick={() => setShowAddSingleModal(true)}
            >
              Thêm từ mới
            </MyButton>
            <MyButton
              variant="secondary"
              size="sm"
              onClick={() => setShowBulkModal(true)}
              title="Nhập nhiều từ cùng lúc từ văn bản"
            >
              Nhập hàng loạt
            </MyButton>
          </div>
        </HeaderTop>

        {/* STUDY MODE TABS */}
        <ModeTabs>
          <ModeTab active={currentMode === "card"} onClick={() => setMode("card")}>
            <IoFlashOutline /> Thẻ Flashcard
          </ModeTab>
          <ModeTab active={currentMode === "quiz"} onClick={() => setMode("quiz")}>
            <MdQuiz /> Trắc nghiệm ({words.length})
          </ModeTab>
          <ModeTab active={currentMode === "typing"} onClick={() => setMode("typing")}>
            <MdKeyboardAlt /> Gõ chính tả
          </ModeTab>
          <ModeTab active={currentMode === "grid"} onClick={() => setMode("grid")}>
            <MdViewModule /> Lưới thẻ
          </ModeTab>
          <ModeTab active={currentMode === "table"} onClick={() => setMode("table")}>
            <MdTableRows /> Quản lý danh sách
          </ModeTab>
        </ModeTabs>
      </PageHeader>

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
                    active={filterType === "all"}
                    onClick={() => setFilterType("all")}
                  >
                    Tất cả ({words.length})
                  </FilterChip>
                  <FilterChip
                    active={filterType === "starred"}
                    onClick={() => setFilterType("starred")}
                  >
                    ⭐ Yêu thích ({words.filter((w) => w.starred).length})
                  </FilterChip>
                  <FilterChip
                    active={filterType === "learning"}
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
                    example={currentWord.example}
                    status={currentWord.status}
                    starred={currentWord.starred}
                    onToggleStar={() => toggleStar(selectedCollection.pathname, currentWord.id)}
                    height="320px"
                  />
                </div>
              )}

              {/* Card Controls */}
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
                  color="#ef4444"
                  onClick={() => handleRateCard("learning")}
                  title="Bấm phím 1"
                >
                  <span>Chưa nhớ</span>
                  <span className="key-hint">Phím 1</span>
                </RateButton>

                <RateButton
                  color="#f59e0b"
                  onClick={() => handleRateCard("learning")}
                  title="Bấm phím 2"
                >
                  <span>Đang học</span>
                  <span className="key-hint">Phím 2</span>
                </RateButton>

                <RateButton
                  color="#10b981"
                  onClick={() => handleRateCard("mastered")}
                  title="Bấm phím 3"
                >
                  <span>Đã thuộc làu</span>
                  <span className="key-hint">Phím 3</span>
                </RateButton>
              </RatingBar>
            </>
          )}
        </StudyWrapper>
      )}

      {/* 2. QUIZ MODE */}
      {currentMode === "quiz" && (
        <QuizContainer>
          {words.length < 2 ? (
            <CompletionCelebration>
              <h3>Cần thêm từ để làm trắc nghiệm</h3>
              <p>Chế độ trắc nghiệm cần tối thiểu 2 thẻ từ vựng để tạo các đáp án lựa chọn.</p>
              <MyButton variant="primary" onClick={() => setShowAddSingleModal(true)}>
                Thêm từ vựng ngay
              </MyButton>
            </CompletionCelebration>
          ) : quizFinished ? (
            <CompletionCelebration>
              <div className="trophy">🎯</div>
              <h2>Hoàn thành bài trắc nghiệm!</h2>
              <p>
                Kết quả của bạn: <strong>{quizScore} / {words.length} câu đúng</strong> ({Math.round((quizScore / words.length) * 100)}%)
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <MyButton variant="primary" onClick={handleRestartQuiz}>
                  Làm lại bài thi
                </MyButton>
                <MyButton variant="secondary" onClick={() => setMode("card")}>
                  Quay lại Flashcard
                </MyButton>
              </div>
            </CompletionCelebration>
          ) : currentQuizWord ? (
            <QuizCard>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span className="quiz-q-label">Câu hỏi {quizIndex + 1} / {words.length}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#10b981" }}>
                  Điểm: {quizScore}
                </span>
              </div>

              <div>
                <h3 className="quiz-term">{currentQuizWord.source}</h3>
                {currentQuizWord.phonetic && (
                  <div style={{ color: "#3b82f6", fontSize: "15px", marginTop: "4px" }}>
                    {currentQuizWord.phonetic}
                  </div>
                )}
                <div style={{ marginTop: "8px" }}>
                  <MyButton
                    variant="ghost"
                    size="sm"
                    icon={<MdVolumeUp />}
                    onClick={() => speakWord(currentQuizWord.source)}
                  >
                    Nghe phát âm
                  </MyButton>
                </div>
              </div>

              <QuizOptionsGrid>
                {quizOptions.map((option, idx) => {
                  const isSelected = quizSelectedOption === option;
                  const isCorrect = option === currentQuizWord.target;
                  return (
                    <OptionButton
                      key={idx}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      showResult={quizSubmitted}
                      onClick={() => handleSelectQuizOption(option)}
                    >
                      <span>{option}</span>
                      {quizSubmitted && isCorrect && <MdCheck size={20} color="#10b981" />}
                      {quizSubmitted && isSelected && !isCorrect && <MdClose size={20} color="#ef4444" />}
                    </OptionButton>
                  );
                })}
              </QuizOptionsGrid>

              {quizSubmitted && (
                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <MyButton variant="primary" size="lg" onClick={handleNextQuizQuestion}>
                    {quizIndex < words.length - 1 ? "Câu tiếp theo →" : "Xem kết quả →"}
                  </MyButton>
                </div>
              )}
            </QuizCard>
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
      {currentMode === "grid" && (
        <WordGrid>
          {words.map((word) => (
            <FlipCard
              key={word.id}
              front={word.source}
              back={word.target}
              phonetic={word.phonetic}
              example={word.example}
              status={word.status}
              starred={word.starred}
              onToggleStar={() => toggleStar(selectedCollection.pathname, word.id)}
              height="250px"
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
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Hiển thị: {words.filter((w) => w.source.toLowerCase().includes(tableSearch.toLowerCase()) || w.target.toLowerCase().includes(tableSearch.toLowerCase())).length} / {words.length} thẻ
            </div>
          </div>

          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Thuật ngữ (Mặt trước)</th>
                  <th>Phiên âm</th>
                  <th>Định nghĩa (Mặt sau)</th>
                  <th>Ví dụ</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Thao tác</th>
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
                            onClick={() => speakWord(word.source)}
                            style={{ color: "#3b82f6", fontSize: "16px" }}
                            title="Nghe phát âm"
                          >
                            <MdVolumeUp />
                          </button>
                        </div>
                      </td>
                      <td style={{ color: "#3b82f6", fontFamily: "monospace" }}>{word.phonetic || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{word.target}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                        {word.example ? `"${word.example}"` : "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            backgroundColor:
                              word.status === "mastered"
                                ? "rgba(16, 185, 129, 0.15)"
                                : word.status === "learning"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(148, 163, 184, 0.15)",
                            color:
                              word.status === "mastered"
                                ? "#059669"
                                : word.status === "learning"
                                ? "#d97706"
                                : "#64748b"
                          }}
                        >
                          {word.status === "mastered" ? "Đã thuộc" : word.status === "learning" ? "Đang học" : "Chưa ôn"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
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

            <MyTextarea
              style={{ minHeight: "180px", fontFamily: "monospace", fontSize: "13px" }}
              placeholder={`Apple - Quả táo - I eat an apple daily\nBanana - Quả chuối\nCat - Con mèo\nDog - Con chó`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              autoFocus
            />

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
