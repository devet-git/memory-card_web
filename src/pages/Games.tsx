import React, { useMemo, useState } from "react";
import styled from "styled-components";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import { PageContainer, Panel, MutedText } from "components/ui";
import Wordle from "components/games/Wordle";
import TrueFalse from "components/games/TrueFalse";
import MemoryFlip from "components/games/MemoryFlip";
import BossBattle from "components/games/BossBattle";
import WordRain from "components/games/WordRain";
import { WordItem } from "types";
import { dateKey } from "utils/dates";
import { pickBosses, MIN_POOL } from "utils/boss";
import { rainWords, RAIN_MIN_WORDS } from "utils/wordRain";
import { profileOf, dailyStreak, wordleWords, TF_MIN_WORDS, MEMORY_MIN_PAIRS, buildMemoryCards, TF_SECONDS } from "utils/games";

type GameId = "wordle-daily" | "wordle" | "tf" | "memory" | "boss" | "rain";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
`;

const GameTile = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};

  .icon {
    font-size: 30px;
  }
  .name {
    font-weight: 800;
    font-size: 16px;
  }
  .desc {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
    line-height: 1.45;
    flex: 1;
  }
  .record {
    font-size: 12px;
    color: #059669;
    font-weight: 700;
  }
`;

const Hero = styled(Panel)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  .coins {
    font-size: 26px;
    font-weight: 800;
    color: #d97706;
  }
`;

const SEP = "::";

export default function GamesPage() {
  const { collections, stats, recordReview } = useCollectionContext();
  const [game, setGame] = useState<GameId | null>(null);
  const [deckPath, setDeckPath] = useState("all");
  const profile = profileOf(stats);
  const today = dateKey();
  const todayResult = profile.daily[today];
  const streak = dailyStreak(profile.daily, today);

  // Cards of the chosen deck(s). Ids are prefixed with the deck so the same id in two decks can't clash.
  const words: WordItem[] = useMemo(
    () =>
      collections
        .filter((c) => deckPath === "all" || c.pathname === deckPath)
        .flatMap((c) => c.words.map((w) => ({ ...w, id: `${c.pathname}${SEP}${w.id}` }))),
    [collections, deckPath]
  );

  const answer = (id: string | number, correct: boolean) => {
    const text = String(id);
    const at = text.indexOf(SEP);
    if (at < 0) return;
    recordReview(text.slice(0, at), text.slice(at + SEP.length), correct);
  };

  const exit = () => setGame(null);

  const wordleCount = useMemo(() => wordleWords(words).length, [words]);
  const memoryPairs = useMemo(() => buildMemoryCards(words, 99).length / 2, [words]);
  const bossCount = useMemo(() => pickBosses(words, 99).length, [words]);
  const rainCount = useMemo(() => rainWords(words).length, [words]);

  if (game === "wordle-daily") return <PageContainer><Wordle mode="daily" words={[]} onAnswer={answer} onExit={exit} /></PageContainer>;
  if (game === "wordle") return <PageContainer><Wordle mode="deck" words={words} onAnswer={answer} onExit={exit} /></PageContainer>;
  if (game === "tf") return <PageContainer><TrueFalse words={words} onAnswer={answer} onExit={exit} /></PageContainer>;
  if (game === "boss") return <PageContainer><BossBattle words={words} onAnswer={answer} onExit={exit} /></PageContainer>;
  if (game === "rain") return <PageContainer><WordRain words={rainWords(words)} onAnswer={answer} onExit={exit} /></PageContainer>;
  if (game === "memory") return <PageContainer><MemoryFlip words={words} onExit={exit} /></PageContainer>;

  const best = (key: string) => (profile.best[key] ? `Kỷ lục: ${profile.best[key]}` : "Chưa có kỷ lục");
  const bestMemory = Math.max(0, ...Object.entries(profile.best).filter(([k]) => k.startsWith("memory-")).map(([, v]) => v));

  return (
    <PageContainer>
      <Hero>
        <div>
          <h2 style={{ margin: 0 }}>Trò chơi</h2>
          <MutedText>Học mà chơi: kiếm xu, phá kỷ lục và giữ chuỗi thử thách hằng ngày.</MutedText>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="coins">{profile.coins} 🪙</div>
          <MutedText>{profile.played} ván đã chơi</MutedText>
        </div>
      </Hero>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>🔤 Thử thách hôm nay</h3>
            <MutedText>
              Cả thế giới cùng đoán một từ tiếng Anh mỗi ngày.
              {streak > 0 ? ` Chuỗi thắng: ${streak} ngày 🔥` : ""}
            </MutedText>
          </div>
          <MyButton variant={todayResult ? "secondary" : "primary"} onClick={() => setGame("wordle-daily")}>
            {todayResult ? (todayResult.won ? "Xem kết quả ✓" : "Xem kết quả") : "Chơi ngay"}
          </MyButton>
        </div>
      </Panel>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Chơi với từ của bạn</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            Bộ thẻ
            <select
              value={deckPath}
              onChange={(e) => setDeckPath(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit", maxWidth: 220 }}
            >
              <option value="all">Tất cả bộ thẻ</option>
              {collections.map((c) => (
                <option key={c.pathname} value={c.pathname}>
                  {c.name} ({c.words.length})
                </option>
              ))}
            </select>
          </label>
        </div>

        <Grid>
          <GameTile $disabled={wordleCount < 1}>
            <span className="icon">🔠</span>
            <span className="name">Đoán chữ</span>
            <span className="desc">Cho nghĩa tiếng Việt, đoán từ tiếng Anh trong 6 lượt. Thắng thì thẻ được tính một lượt ôn đúng.</span>
            <span className="record">{wordleCount ? best("wordle") : "Cần từ đơn 3–8 chữ cái"}</span>
            <MyButton variant="primary" disabled={wordleCount < 1} onClick={() => setGame("wordle")}>
              Chơi
            </MyButton>
          </GameTile>

          <GameTile $disabled={words.length < TF_MIN_WORDS}>
            <span className="icon">⚡</span>
            <span className="name">Đúng hay sai {TF_SECONDS}s</span>
            <span className="desc">Nghĩa này đúng hay sai? Trả lời liên tiếp để nhân điểm. Từ nào sai sẽ được đưa vào lịch ôn lại.</span>
            <span className="record">{words.length >= TF_MIN_WORDS ? best("tf") : `Cần ít nhất ${TF_MIN_WORDS} thẻ`}</span>
            <MyButton variant="primary" disabled={words.length < TF_MIN_WORDS} onClick={() => setGame("tf")}>
              Chơi
            </MyButton>
          </GameTile>

          <GameTile $disabled={memoryPairs < MEMORY_MIN_PAIRS}>
            <span className="icon">🃏</span>
            <span className="name">Lật thẻ trí nhớ</span>
            <span className="desc">Lật hai thẻ để ghép từ với nghĩa. Ít lượt và nhanh thì được nhiều sao và xu hơn.</span>
            <span className="record">{memoryPairs >= MEMORY_MIN_PAIRS ? (bestMemory ? `Kỷ lục: ${bestMemory}` : "Chưa có kỷ lục") : `Cần ít nhất ${MEMORY_MIN_PAIRS} thẻ`}</span>
            <MyButton variant="primary" disabled={memoryPairs < MEMORY_MIN_PAIRS} onClick={() => setGame("memory")}>
              Chơi
            </MyButton>
          </GameTile>

          <GameTile $disabled={bossCount < 1 || words.length < MIN_POOL}>
            <span className="icon">👹</span>
            <span className="name">Đấu trùm</span>
            <span className="desc">Hạ các quái nhỏ rồi đánh bại “trùm”: thẻ bạn hay quên. Thắng thì thẻ đó được tính một lượt ôn đúng.</span>
            <span className="record">{bossCount >= 1 && words.length >= MIN_POOL ? `${bossCount} trùm đang chờ • ${best("boss")}` : "Chưa có thẻ hay sai để làm trùm"}</span>
            <MyButton variant="primary" disabled={bossCount < 1 || words.length < MIN_POOL} onClick={() => setGame("boss")}>
              Khiêu chiến
            </MyButton>
          </GameTile>

          <GameTile $disabled={rainCount < RAIN_MIN_WORDS}>
            <span className="icon">🌧️</span>
            <span className="name">Mưa chữ</span>
            <span className="desc">Nghĩa tiếng Việt rơi xuống, gõ từ tiếng Anh để phá trước khi chạm đất. Càng lâu mưa càng nhanh.</span>
            <span className="record">{rainCount >= RAIN_MIN_WORDS ? best("rain") : `Cần ít nhất ${RAIN_MIN_WORDS} từ ngắn`}</span>
            <MyButton variant="primary" disabled={rainCount < RAIN_MIN_WORDS} onClick={() => setGame("rain")}>
              Chơi
            </MyButton>
          </GameTile>
        </Grid>
        <MutedText style={{ marginTop: 12 }}>
          Lịch ôn chỉ thay đổi khi: thắng/thua ở Đoán chữ, hạ hoặc thua trùm, và những từ bạn trả lời sai ở Đúng/sai hay để rơi xuống đất ở Mưa chữ. Lật thẻ chỉ để khởi động nên không đổi lịch.
          Điểm, xu và kỷ lục lưu ngay trên trình duyệt này và được đồng bộ cùng dữ liệu học khi bạn dùng Google Drive.
        </MutedText>
      </Panel>
    </PageContainer>
  );
}
