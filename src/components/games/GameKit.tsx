import React from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { Panel } from "components/ui";

// Small building blocks shared by every mini game: the header and the result card.

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-size: 18px;
  }

  .meta {
    display: flex;
    gap: 14px;
    align-items: center;
    font-size: 14px;
    font-weight: 700;
    flex-wrap: wrap;
  }
`;

export const GameBox = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
`;

export function GameHeader({ title, onExit, meta }: { title: string; onExit: () => void; meta?: React.ReactNode }) {
  return (
    <Header>
      <h2>{title}</h2>
      <div className="meta">
        {meta}
        <MyButton variant="ghost" size="sm" onClick={onExit}>
          Thoát
        </MyButton>
      </div>
    </Header>
  );
}

const Result = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 8px 0;

  .emoji {
    font-size: 40px;
  }
  h3 {
    margin: 0;
    font-size: 20px;
  }
  .lines {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
    width: 100%;
  }
  .line {
    background: var(--bg-tertiary, #f1f5f9);
    border-radius: 10px;
    padding: 8px;
    display: flex;
    flex-direction: column;
  }
  .line b {
    font-size: 20px;
  }
  .line span {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
  .coins {
    font-weight: 800;
    color: #d97706;
  }
  .best {
    color: #059669;
    font-weight: 700;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

interface ResultProps {
  emoji: string;
  title: string;
  lines: [string, string | number][];
  coins: number;
  newBest?: boolean;
  note?: React.ReactNode;
  children?: React.ReactNode; // extra content between the stats and the buttons
  onReplay?: () => void;
  replayLabel?: string;
  onExit: () => void;
}

export function GameResultCard({ emoji, title, lines, coins, newBest, note, children, onReplay, replayLabel = "Chơi lại", onExit }: ResultProps) {
  return (
    <Result role="status">
      <div className="emoji" aria-hidden>
        {emoji}
      </div>
      <h3>{title}</h3>
      {newBest && <div className="best">🏅 Kỷ lục mới!</div>}
      <div className="lines">
        {lines.map(([label, value]) => (
          <div className="line" key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="coins">+{coins} 🪙</div>
      {note}
      {children}
      <div className="actions">
        {onReplay && (
          <MyButton variant="primary" onClick={onReplay}>
            {replayLabel}
          </MyButton>
        )}
        <MyButton variant="ghost" onClick={onExit}>
          Về trang trò chơi
        </MyButton>
      </div>
    </Result>
  );
}
