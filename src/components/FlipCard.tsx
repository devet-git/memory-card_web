import React, { useState } from "react";
import styled from "styled-components";
import { HiOutlineVolumeUp } from "react-icons/hi";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { BiRefresh } from "react-icons/bi";
import { speakWord } from "utils/speech";
import { playSound } from "utils/sound";
import { MasteryStatus } from "types";

interface CardProps {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  status?: MasteryStatus;
  starred?: boolean;
  onToggleStar?: () => void;
  onStatusChange?: (status: MasteryStatus) => void;
  height?: string;
  showStatusActions?: boolean;
}

const CardContainer = styled.div<{ $height?: string }>`
  perspective: 1200px;
  width: 100%;
  height: ${(props) => props.$height || "280px"};
  min-height: 220px;
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

const CardSide = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  padding: 28px 32px;
  box-shadow: var(--card-shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05));
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  @media (max-width: 640px) {
    padding: 20px 16px;
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

const CardTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
`;

const SideBadge = styled.span<{ $side: "front" | "back" }>`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 6px;
  background-color: ${(props) => (props.$side === "front" ? "rgba(59, 130, 246, 0.12)" : "rgba(139, 92, 246, 0.12)")};
  color: ${(props) => (props.$side === "front" ? "#2563eb" : "#7c3aed")};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px;
  color: ${(props) => (props.$active ? "#f59e0b" : "var(--text-muted, #94a3b8)")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--bg-tertiary, #f1f5f9);
    color: ${(props) => (props.$active ? "#d97706" : "var(--text-primary, #0f172a)")};
    transform: scale(1.1);
  }
`;

const CardMainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8px 12px;
`;

const PrimaryText = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  margin: 0 0 10px 0;
  line-height: 1.35;
  word-break: break-word;

  @media (max-width: 640px) {
    font-size: 24px;
  }
`;

const PhoneticText = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 10px;
  font-family: var(--font-main, sans-serif);
`;

const ExampleText = styled.p`
  font-size: 16px;
  color: var(--text-secondary, #475569);
  font-style: italic;
  max-width: 95%;
  margin: 8px 0 0 0;
  line-height: 1.5;

  @media (max-width: 640px) {
    font-size: 14px;
  }
`;

const CardBottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color, #e2e8f0);
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
`;

const FlipHint = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  opacity: 0.8;

  svg {
    font-size: 16px;
    animation: rotateHint 2.5s infinite linear;
  }

  @keyframes rotateHint {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusPill = styled.span<{ $status?: MasteryStatus }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
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
  status = "new",
  starred = false,
  onToggleStar,
  height,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    playSound("flip");
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakWord(text);
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
    <CardContainer $height={height} onClick={handleCardClick} title="Nhấn để lật thẻ (hoặc bấm Space)">
      <CardFlipper $isFlipped={isFlipped}>
        {/* FRONT SIDE */}
        <FrontSide>
          <CardTopBar>
            <SideBadge $side="front">Mặt trước (Từ / Câu hỏi)</SideBadge>
            <ActionButtons>
              <IconButton
                onClick={(e) => handleSpeak(e, front)}
                title="Nghe phát âm"
                aria-label="Phát âm"
              >
                <HiOutlineVolumeUp />
              </IconButton>
              {onToggleStar && (
                <IconButton
                  $active={starred}
                  onClick={handleStar}
                  title={starred ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  {starred ? <AiFillStar /> : <AiOutlineStar />}
                </IconButton>
              )}
            </ActionButtons>
          </CardTopBar>

          <CardMainContent>
            <PrimaryText>{front}</PrimaryText>
            {phonetic && <PhoneticText>{phonetic}</PhoneticText>}
          </CardMainContent>

          <CardBottomBar>
            <StatusPill $status={status}>{statusLabels[status]}</StatusPill>
            <FlipHint>
              <BiRefresh /> Nhấp để lật nghĩa
            </FlipHint>
          </CardBottomBar>
        </FrontSide>

        {/* BACK SIDE */}
        <BackSide>
          <CardTopBar>
            <SideBadge $side="back">Mặt sau (Định nghĩa)</SideBadge>
            <ActionButtons>
              <IconButton
                onClick={(e) => handleSpeak(e, back)}
                title="Nghe phát âm định nghĩa"
                aria-label="Phát âm định nghĩa"
              >
                <HiOutlineVolumeUp />
              </IconButton>
              {onToggleStar && (
                <IconButton
                  $active={starred}
                  onClick={handleStar}
                  title={starred ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  {starred ? <AiFillStar /> : <AiOutlineStar />}
                </IconButton>
              )}
            </ActionButtons>
          </CardTopBar>

          <CardMainContent>
            <PrimaryText style={{ color: "#2563eb" }}>{back}</PrimaryText>
            {example && <ExampleText>"{example}"</ExampleText>}
          </CardMainContent>

          <CardBottomBar>
            <StatusPill $status={status}>{statusLabels[status]}</StatusPill>
            <FlipHint>
              <BiRefresh /> Nhấp để quay lại
            </FlipHint>
          </CardBottomBar>
        </BackSide>
      </CardFlipper>
    </CardContainer>
  );
}
