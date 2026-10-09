import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { firstMeaning, profileOf } from "utils/games";
import { equippedData } from "utils/shop";
import { DEFAULT_SKIN, Plant, Skin, emojiOf, plantOf, sortPlants, summarize } from "utils/garden";
import { DAY_MS } from "utils/srs";
import { GameBox, GameHeader } from "./GameKit";

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 8px;

  .box {
    background: var(--bg-tertiary, #f1f5f9);
    border-radius: 10px;
    padding: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
  }
  .box b {
    font-size: 18px;
  }
  .box span {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.1), rgba(132, 90, 40, 0.12));
`;

const Tile = styled.button<{ $thirst: Plant["thirst"]; $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 2px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$selected ? "var(--accent-primary, #3b82f6)" : "transparent")};
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  opacity: ${(p) => (p.$thirst === "fresh" ? 1 : p.$thirst === "thirsty" ? 0.8 : 0.6)};
  filter: ${(p) => (p.$thirst === "wilted" ? "grayscale(0.6)" : "none")};

  .emoji {
    font-size: 28px;
    line-height: 1.1;
    transform: ${(p) => (p.$thirst === "thirsty" ? "rotate(-8deg)" : "none")};
  }
  .name {
    font-size: 11px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PAGE = 60;

const ago = (ms: number): string => {
  const days = Math.floor(ms / DAY_MS);
  return days <= 0 ? "hôm nay" : days === 1 ? "hôm qua" : `${days} ngày trước`;
};

/** Every card is a plant: well-learned cards grow, forgotten ones wilt until you review them. */
export default function Garden({ words, onExit }: { words: WordItem[]; onExit: () => void }) {
  const { stats } = useCollectionContext();
  const navigate = useNavigate();
  const skin = (equippedData(profileOf(stats), "plant") as Skin | null) || DEFAULT_SKIN;
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(null);

  const now = Date.now();
  const plants = useMemo(() => sortPlants(words.map((w) => plantOf(w, now))), [words]); // eslint-disable-line react-hooks/exhaustive-deps
  const sum = useMemo(() => summarize(plants), [plants]);
  const pick = plants.find((p) => String(p.word.id) === selected) || null;

  return (
    <GameBox style={{ maxWidth: 720 }}>
      <GameHeader title="Vườn từ vựng" onExit={onExit} meta={<span>🌿 {Math.round(sum.health * 100)}%</span>} />
      <Stats>
        <div className="box">
          <b>{sum.stages.bloom}</b>
          <span>{skin.bloom} Ra hoa</span>
        </div>
        <div className="box">
          <b>{sum.stages.tree}</b>
          <span>{skin.tree} Trưởng thành</span>
        </div>
        <div className="box">
          <b>{sum.stages.sprout}</b>
          <span>{skin.sprout} Nảy mầm</span>
        </div>
        <div className="box">
          <b>{sum.stages.seed}</b>
          <span>{skin.seed} Hạt giống</span>
        </div>
        <div className="box">
          <b>{sum.wilted}</b>
          <span>{skin.wilted} Đang héo</span>
        </div>
      </Stats>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Mỗi thẻ là một cây. Thẻ ôn đều sẽ lớn dần từ hạt giống thành cây ra hoa. Cây héo là thẻ bạn có nhiều khả năng đã quên, hãy ôn để tưới nước. Độ tươi dựa trên xác suất nhớ ước tính ngay lúc này.
      </p>

      {plants.length === 0 ? (
        <p style={{ margin: 0 }}>Vườn còn trống. Hãy thêm thẻ để gieo hạt.</p>
      ) : (
        <Field>
          {plants.slice(0, shown).map((p) => (
            <Tile
              key={String(p.word.id)}
              $thirst={p.thirst}
              $selected={selected === String(p.word.id)}
              onClick={() => setSelected(String(p.word.id))}
              aria-label={`${p.word.source}: ${p.health === null ? "chưa ôn" : `${Math.round(p.health * 100)}%`}`}
              title={`${p.word.source} • ${p.health === null ? "chưa ôn" : `nhớ ${Math.round(p.health * 100)}%`}`}
            >
              <span className="emoji">{emojiOf(p, skin)}</span>
              <span className="name">{p.word.source}</span>
            </Tile>
          ))}
        </Field>
      )}
      {plants.length > shown && (
        <div style={{ textAlign: "center" }}>
          <MyButton variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
            Xem thêm ({plants.length - shown} cây)
          </MyButton>
        </div>
      )}

      {pick && (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: 4 }} aria-live="polite">
          <div style={{ fontSize: 18 }}>
            <span style={{ marginRight: 8 }}>{emojiOf(pick, skin)}</span>
            <b>{pick.word.source}</b> — {firstMeaning(pick.word.target)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {pick.health === null
              ? "Chưa ôn lần nào, đây vẫn là hạt giống."
              : `Khả năng nhớ ước tính: ${Math.round(pick.health * 100)}% • ôn lần cuối ${pick.word.lastReviewed ? ago(now - pick.word.lastReviewed) : "—"}`}
            {pick.word.dueDate ? ` • hạn ôn ${pick.word.dueDate <= now ? "đã đến" : `sau ${Math.ceil((pick.word.dueDate - now) / DAY_MS)} ngày`}` : ""}
          </div>
          {pick.thirst !== "fresh" && pick.health !== null && (
            <div>
              <MyButton variant="primary" size="sm" onClick={() => navigate("/review")}>
                💧 Đi ôn tập để tưới cây
              </MyButton>
            </div>
          )}
        </div>
      )}
    </GameBox>
  );
}
