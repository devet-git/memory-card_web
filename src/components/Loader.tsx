import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

// A flashcard that keeps flipping: English on the front, the Vietnamese meaning on the back.
// The word pair advances each time the card finishes a full turn (onAnimationIteration).
const PAIRS: [string, string][] = [
  ["Hello", "Xin chào"],
  ["Memory", "Trí nhớ"],
  ["Practice", "Luyện tập"],
  ["Friend", "Bạn bè"],
  ["Streak", "Chuỗi ngày"],
  ["Goal", "Mục tiêu"],
  ["Learn", "Học"],
  ["Review", "Ôn tập"]
];

const TIPS = [
  "Nhấn Space để lật thẻ, phím 1-4 để chấm điểm khi ôn tập.",
  "Ôn một ít mỗi ngày hiệu quả hơn học dồn một lần.",
  "Gắn từ mới với một hình ảnh hay câu nói vui để nhớ lâu hơn.",
  "Nhấn Ctrl+K để tìm nhanh mọi thẻ trong các bộ.",
  "Đặt câu với từ mới giúp bạn nhớ cách dùng, không chỉ nghĩa.",
  "Thẻ hay quên sẽ được gắn cờ ⚠ để bạn luyện riêng.",
  "Bấm Z khi ôn tập để hoàn tác câu vừa chấm nhầm."
];

const flip = keyframes`
  0%, 36%   { transform: rotateY(0deg); }
  50%, 86%  { transform: rotateY(180deg); }
  100%      { transform: rotateY(360deg); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
`;

const shadowPulse = keyframes`
  0%, 100% { transform: scaleX(1);    opacity: 0.28; }
  50%      { transform: scaleX(0.72); opacity: 0.14; }
`;

const fan = keyframes`
  0%, 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
  50%      { transform: translate(calc(var(--dx) * 1.6), calc(var(--dy) * 1.2)) rotate(calc(var(--rot) * 1.5)); }
`;

const dots = keyframes`
  0%, 20%  { opacity: 0.2; transform: translateY(0); }
  40%      { opacity: 1;   transform: translateY(-3px); }
  60%,100% { opacity: 0.2; transform: translateY(0); }
`;

const sweep = keyframes`
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(260%); }
`;

const tipIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(p) => (p.$compact ? "10px" : "18px")};
  padding: ${(p) => (p.$compact ? "14px 8px" : "24px 16px")};
  text-align: center;
  color: var(--text-primary, #0f172a);
`;

const Stage = styled.div<{ $compact: boolean }>`
  --w: ${(p) => (p.$compact ? "92px" : "148px")};
  --h: ${(p) => (p.$compact ? "62px" : "100px")};
  position: relative;
  width: var(--w);
  height: var(--h);
  perspective: 700px;
  margin-bottom: ${(p) => (p.$compact ? "10px" : "16px")};
`;

const Ghost = styled.span<{ $dx: string; $dy: string; $rot: string; $delay: string; $alt: boolean }>`
  --dx: ${(p) => p.$dx};
  --dy: ${(p) => p.$dy};
  --rot: ${(p) => p.$rot};
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: ${(p) => (p.$alt ? "linear-gradient(135deg, #a78bfa, #8b5cf6)" : "linear-gradient(135deg, #93c5fd, #60a5fa)")};
  opacity: 0.55;
  animation: ${fan} 2.4s ease-in-out ${(p) => p.$delay} infinite;
`;

const Bobber = styled.div`
  position: absolute;
  inset: 0;
  animation: ${bob} 2.4s ease-in-out infinite;
  transform-style: preserve-3d;
`;

const Flipper = styled.div`
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: ${flip} 2.4s cubic-bezier(0.6, 0, 0.3, 1) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Face = styled.div<{ $back?: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 14px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: ${(p) => (p.$back ? "rotateY(180deg)" : "none")};
  color: ${(p) => (p.$back ? "#ffffff" : "var(--text-primary, #0f172a)")};
  background: ${(p) => (p.$back ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" : "var(--bg-card, #ffffff)")};
  border: 2px solid ${(p) => (p.$back ? "transparent" : "#3b82f6")};
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.28);

  small {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    opacity: 0.7;
  }

  strong {
    font-size: calc(var(--h) * 0.2);
    font-weight: 800;
    line-height: 1.1;
    padding: 0 6px;
  }
`;

const Shadow = styled.span`
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -18px;
  height: 10px;
  border-radius: 50%;
  background: #1e3a8a;
  filter: blur(6px);
  animation: ${shadowPulse} 2.4s ease-in-out infinite;
`;

const Label = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 700;
  font-size: 15px;

  .dot {
    display: inline-block;
    animation: ${dots} 1.2s infinite;
  }
  .dot:nth-child(2) {
    animation-delay: 0.15s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.3s;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
      opacity: 1;
    }
  }
`;

const Tip = styled.p`
  margin: 0;
  max-width: 340px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
  animation: ${tipIn} 0.4s ease both;
`;

const Bar = styled.div`
  width: 160px;
  height: 4px;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--bg-tertiary, #e2e8f0);

  span {
    display: block;
    width: 40%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    animation: ${sweep} 1.3s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      width: 100%;
    }
  }
`;

interface CardLoaderProps {
  label?: string;
  /** Smaller card without the tip and progress bar, for modals and inline waits */
  compact?: boolean;
}

export function CardLoader({ label = "Đang tải", compact = false }: CardLoaderProps) {
  // Start from a random pair so repeated loaders don't always show "Hello"
  const [turn, setTurn] = useState(() => Math.floor(Math.random() * PAIRS.length));
  const [front, back] = PAIRS[turn % PAIRS.length];
  const tip = TIPS[turn % TIPS.length];

  return (
    <Wrap $compact={compact} role="status" aria-live="polite" aria-label={label}>
      <Stage $compact={compact}>
        <Ghost $dx="-10px" $dy="6px" $rot="-7deg" $delay="0s" $alt={false} />
        <Ghost $dx="10px" $dy="4px" $rot="6deg" $delay="0.2s" $alt />
        <Bobber>
          <Flipper onAnimationIteration={() => setTurn((t) => t + 1)}>
            <Face>
              <small>EN</small>
              <strong>{front}</strong>
            </Face>
            <Face $back>
              <small>VI</small>
              <strong>{back}</strong>
            </Face>
          </Flipper>
        </Bobber>
        <Shadow />
      </Stage>

      <Label>
        {label}
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </Label>

      {!compact && (
        <>
          <Bar aria-hidden="true">
            <span />
          </Bar>
          <Tip key={turn}>💡 {tip}</Tip>
        </>
      )}
    </Wrap>
  );
}

const PageWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 55vh;
`;

/** Full-page placeholder shown while a route's code is loading. */
export function PageLoader({ label = "Đang tải MemCard" }: { label?: string }) {
  return (
    <PageWrap>
      <CardLoader label={label} />
    </PageWrap>
  );
}

export default CardLoader;
