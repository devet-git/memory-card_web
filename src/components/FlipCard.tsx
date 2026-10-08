import React, { useState } from "react";
import styled from "styled-components";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { BiRefresh } from "react-icons/bi";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { playSound } from "utils/sound";
import { MasteryStatus } from "types";

interface CardProps {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  image?: string;
  mnemonic?: string;
  status?: MasteryStatus;
  starred?: boolean;
  onToggleStar?: () => void;
  onStatusChange?: (status: MasteryStatus) => void;
  height?: string;
  showStatusActions?: boolean;
  compact?: boolean;
}

const CardContainer = styled.div<{ $height?: string; $compact?: boolean }>`
  perspective: 1200px;
  width: 100%;
  height: ${(props) => props.$height || (props.$compact ? "260px" : "280px")};
  min-height: ${(props) => (props.$compact ? "230px" : "220px")};
  cursor: pointer;
  user-select: none;
`;

const CardFlipper = styled.div<{ $isFlipped: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
  transform: ${(props) => (props.$isFlipped ? "rotateY(180deg)" : "rotateY(0deg)")};
`;

const CardSide = styled.div<{ $compact?: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: ${(props) => (props.$compact ? "16px" : "18px")};
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: ${(props) => (props.$compact ? "16px 18px" : "28px 32px")};
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  @media (max-width: 640px) {
    padding: ${(props) => (props.$compact ? "14px 14px" : "16px 14px")};
    border-radius: 14px;
  }

  &:hover {
    box-shadow: var(--card-shadow-hover, 0 20px 30px -10px rgba(59, 130, 246, 0.15));
    border-color: rgba(59, 130, 246, 0.4);
  }
`;

const FrontSide = styled(CardSide)`
  background: var(--bg-card, #ffffff);
`;

const BackSide = styled(CardSide)`
  transform: rotateY(180deg);
  background: linear-gradient(145deg, var(--bg-card, #ffffff) 0%, var(--bg-tertiary, #f1f5f9) 100%);
`;

const CardTopBar = styled.div<{ $compact?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: ${(props) => (props.$compact ? "6px" : "12px")};
  flex-shrink: 0;
`;

const SideBadge = styled.span<{ $side: "front" | "back"; $compact?: boolean }>`
  font-size: ${(props) => (props.$compact ? "10px" : "11px")};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${(props) => (props.$compact ? "2px 7px" : "3px 8px")};
  border-radius: 6px;
  background-color: ${(props) => (props.$side === "front" ? "rgba(59, 130, 246, 0.12)" : "rgba(139, 92, 246, 0.12)")};
  color: ${(props) => (props.$side === "front" ? "#2563eb" : "#7c3aed")};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconButton = styled.button<{ $active?: boolean; $compact?: boolean }>`
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: ${(props) => (props.$compact ? "4px" : "6px")};
  color: ${(props) => (props.$active ? "#f59e0b" : "var(--text-muted, #94a3b8)")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => (props.$compact ? "16px" : "18px")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--bg-tertiary, #f1f5f9);
    color: ${(props) => (props.$active ? "#d97706" : "var(--text-primary, #0f172a)")};
    transform: scale(1.1);
  }
`;

const CardMainContent = styled.div<{ $compact?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: ${(props) => (props.$compact ? "4px 6px" : "8px 12px")};
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

const PrimaryText = styled.h2<{ $compact?: boolean; $length?: number }>`
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: ${(props) => (props.$compact ? "0 0 6px 0" : "0 0 10px 0")};
  line-height: 1.32;
  word-break: break-word;
  overflow-wrap: break-word;
  font-size: ${(props) => {
    const len = props.$length || 0;
    if (props.$compact) {
      if (len > 45) return "15px";
      if (len > 25) return "17px";
      if (len > 12) return "19px";
      return "21px";
    }
    if (len > 50) return "clamp(18px, 4vw, 24px)";
    if (len > 25) return "clamp(20px, 4.5vw, 28px)";
    return "clamp(22px, 5.5vw, 32px)";
  }};
`;

const PhoneticText = styled.div<{ $compact?: boolean }>`
  font-size: ${(props) => (props.$compact ? "13px" : "16px")};
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: ${(props) => (props.$compact ? "4px" : "10px")};
  font-family: var(--font-main, sans-serif);

  @media (max-width: 640px) {
    font-size: ${(props) => (props.$compact ? "12px" : "14px")};
    margin-bottom: ${(props) => (props.$compact ? "4px" : "6px")};
  }
`;

const MemoryAid = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: ${(props) => (props.$compact ? "4px" : "8px")};
  max-width: 100%;

  img {
    max-width: 100%;
    max-height: ${(props) => (props.$compact ? "56px" : "110px")};
    object-fit: contain;
    border-radius: 8px;
  }

  .mnemonic {
    font-size: ${(props) => (props.$compact ? "11.5px" : "13px")};
    color: #b45309;
    background: rgba(245, 158, 11, 0.12);
    padding: 3px 10px;
    border-radius: 8px;
  }
`;

const ExampleText = styled.p<{ $compact?: boolean }>`
  font-size: ${(props) => (props.$compact ? "12.5px" : "15px")};
  color: var(--text-secondary, #475569);
  font-style: italic;
  max-width: 95%;
  margin: ${(props) => (props.$compact ? "4px 0 0 0" : "8px 0 0 0")};
  line-height: ${(props) => (props.$compact ? "1.35" : "1.5")};
  word-break: break-word;

  ${(props) =>
    props.$compact &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}

  @media (max-width: 640px) {
    font-size: ${(props) => (props.$compact ? "12px" : "13px")};
    line-height: 1.35;
  }
`;

const CardBottomBar = styled.div<{ $compact?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${(props) => (props.$compact ? "8px" : "12px")};
  border-top: 1px dashed var(--border-color, #e2e8f0);
  font-size: ${(props) => (props.$compact ? "11.5px" : "12px")};
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
`;

const FlipHint = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: ${(props) => (props.$compact ? "11px" : "12px")};
  color: var(--text-muted, #94a3b8);
  opacity: 0.8;
  white-space: nowrap;

  svg {
    font-size: ${(props) => (props.$compact ? "14px" : "16px")};
    animation: rotateHint 2.5s infinite linear;
  }

  @keyframes rotateHint {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusPill = styled.span<{ $status?: MasteryStatus; $compact?: boolean }>`
  font-size: ${(props) => (props.$compact ? "10.5px" : "11px")};
  font-weight: 600;
  padding: ${(props) => (props.$compact ? "2px 7px" : "3px 8px")};
  border-radius: 9999px;
  white-space: nowrap;
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

export default function FlipCard({
  front,
  back,
  phonetic,
  example,
  image,
  mnemonic,
  status = "new",
  starred = false,
  onToggleStar,
  height,
  compact = false,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    playSound("flip");
    setIsFlipped(!isFlipped);
  };

  const { speak, isLoading } = useSpeak();

  const handleSpeak = (e: React.MouseEvent, key: string, text: string) => {
    e.stopPropagation();
    speak(key, text);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStar) onToggleStar();
  };

  const statusLabels: Record<MasteryStatus, string> = {
    new: "Chưa ôn",
    learning: "Đang học",
    mastered: "Đã nhớ"
  };

  return (
    <CardContainer $height={height} $compact={compact} onClick={handleCardClick} title="Nhấn để lật thẻ (hoặc bấm Space)">
      <CardFlipper $isFlipped={isFlipped}>
        {/* FRONT SIDE */}
        <FrontSide $compact={compact}>
          <CardTopBar $compact={compact}>
            <SideBadge $side="front" $compact={compact}>Mặt trước (Từ / Câu hỏi)</SideBadge>
            <ActionButtons>
              <IconButton
                $compact={compact}
                onClick={(e) => handleSpeak(e, "front", front)}
                aria-busy={isLoading("front")}
                title="Nghe phát âm"
                aria-label="Phát âm"
              >
                {isLoading("front") ? <SpeakSpinner /> : <HiOutlineVolumeUp />}
              </IconButton>
              {onToggleStar && (
                <IconButton
                  $compact={compact}
                  $active={starred}
                  onClick={handleStar}
                  title={starred ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  {starred ? <AiFillStar /> : <AiOutlineStar />}
                </IconButton>
              )}
            </ActionButtons>
          </CardTopBar>

          <CardMainContent $compact={compact}>
            <PrimaryText $compact={compact} $length={front.length}>
              {front}
            </PrimaryText>
            {phonetic && <PhoneticText $compact={compact}>{phonetic}</PhoneticText>}
          </CardMainContent>

          <CardBottomBar $compact={compact}>
            <StatusPill $status={status} $compact={compact}>{statusLabels[status]}</StatusPill>
            <FlipHint $compact={compact}>
              <BiRefresh /> Nhấp để lật nghĩa
            </FlipHint>
          </CardBottomBar>
        </FrontSide>

        {/* BACK SIDE */}
        <BackSide $compact={compact}>
          <CardTopBar $compact={compact}>
            <SideBadge $side="back" $compact={compact}>Mặt sau (Định nghĩa)</SideBadge>
            <ActionButtons>
              <IconButton
                $compact={compact}
                onClick={(e) => handleSpeak(e, "back", back)}
                aria-busy={isLoading("back")}
                title="Nghe phát âm định nghĩa"
                aria-label="Phát âm định nghĩa"
              >
                {isLoading("back") ? <SpeakSpinner /> : <HiOutlineVolumeUp />}
              </IconButton>
              {onToggleStar && (
                <IconButton
                  $compact={compact}
                  $active={starred}
                  onClick={handleStar}
                  title={starred ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  {starred ? <AiFillStar /> : <AiOutlineStar />}
                </IconButton>
              )}
            </ActionButtons>
          </CardTopBar>

          <CardMainContent $compact={compact}>
            <PrimaryText $compact={compact} $length={back.length} style={{ color: "#2563eb" }}>
              {back}
            </PrimaryText>
            {example && <ExampleText $compact={compact}>"{example}"</ExampleText>}
            {(image || mnemonic) && (
              <MemoryAid $compact={compact}>
                {image && (
                  <img
                    src={image}
                    alt={front}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {mnemonic && <span className="mnemonic">💡 {mnemonic}</span>}
              </MemoryAid>
            )}
          </CardMainContent>

          <CardBottomBar $compact={compact}>
            <StatusPill $status={status} $compact={compact}>{statusLabels[status]}</StatusPill>
            <FlipHint $compact={compact}>
              <BiRefresh /> Nhấp để quay lại
            </FlipHint>
          </CardBottomBar>
        </BackSide>
      </CardFlipper>
    </CardContainer>
  );
}
