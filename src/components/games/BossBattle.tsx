import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { playSound } from "utils/sound";
import { shuffle, isNewBest, firstMeaning } from "utils/games";
import { isLeech } from "utils/plan";
import {
  HEARTS,
  MINIONS,
  BOSS_HP,
  BattleQuestion,
  BossCandidate,
  pickBosses,
  minionQuestion,
  bossQuestion,
  isCorrect,
  battleScore,
  battleCoins,
  bossEmoji
} from "utils/boss";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";

const Arena = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .hearts {
    font-size: 20px;
    letter-spacing: 2px;
  }
  .steps {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--border-color, #cbd5e1);
  }
  .dot.done {
    background: #10b981;
    border-color: #10b981;
  }
  .dot.fail {
    background: #ef4444;
    border-color: #ef4444;
  }
  .boss {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--bg-tertiary, #f1f5f9);
  }
  .boss .face {
    font-size: 38px;
    line-height: 1;
  }
  .hp {
    flex: 1;
    display: flex;
    gap: 4px;
  }
  .hp span {
    flex: 1;
    height: 12px;
    border-radius: 6px;
    background: #ef4444;
  }
  .hp span.gone {
    background: var(--border-color, #cbd5e1);
  }
`;

const Card = styled.div`
  text-align: center;
  padding: 18px 12px;
  border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);

  .label {
    font-size: 12px;
    font-weight: 700;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .prompt {
    margin: 4px 0;
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
  .q {
    font-size: clamp(24px, 6vw, 32px);
    font-weight: 800;
  }
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Option = styled.button<{ $state: "idle" | "right" | "wrong" | "dim" }>`
  padding: 12px 10px;
  border-radius: 12px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  text-align: center;
  border: 2px solid ${(p) => (p.$state === "right" ? "#10b981" : p.$state === "wrong" ? "#ef4444" : "var(--border-color, #cbd5e1)")};
  background: ${(p) => (p.$state === "right" ? "rgba(16,185,129,0.15)" : p.$state === "wrong" ? "rgba(239,68,68,0.15)" : "transparent")};
  opacity: ${(p) => (p.$state === "dim" ? 0.5 : 1)};

  kbd {
    opacity: 0.55;
    margin-right: 6px;
    font-size: 12px;
  }
`;

interface Props {
  words: WordItem[];
  onAnswer: (wordId: string | number, correct: boolean) => void;
  onExit: () => void;
}

type Stage = "minion" | "boss";
interface Reveal {
  correct: boolean;
  picked: string;
}

/** Defeat a few minions, then the boss: a card you keep forgetting. Win and the card counts as remembered. */
export default function BossBattle({ words, onAnswer, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const candidates = useMemo(() => pickBosses(words), [words]);
  const [chosen, setChosen] = useState(0);
  const [phase, setPhase] = useState<"intro" | "fight" | "over">("intro");
  const [boss, setBoss] = useState<WordItem | null>(null);
  const [minions, setMinions] = useState<WordItem[]>([]);
  const [results, setResults] = useState<boolean[]>([]); // one entry per minion answered
  const [stage, setStage] = useState<Stage>("minion");
  const [hearts, setHearts] = useState(HEARTS);
  const [damage, setDamage] = useState(0);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [typed, setTyped] = useState("");
  const [summary, setSummary] = useState<{ score: number; coins: number; newBest: boolean; won: boolean } | null>(null);
  const poolRef = useRef(words);
  const missed = useRef(new Set<string>());
  const reported = useRef(false);

  const selected: BossCandidate | undefined = candidates[Math.min(chosen, candidates.length - 1)];

  const start = (candidate: BossCandidate) => {
    const pool = words;
    poolRef.current = pool;
    const b = candidate.word;
    const picked = shuffle(pool.filter((w) => w.id !== b.id && !isLeech(w))).slice(0, MINIONS);
    setBoss(b);
    setMinions(picked);
    setResults([]);
    setHearts(HEARTS);
    setDamage(0);
    setReveal(null);
    setTyped("");
    setSummary(null);
    missed.current = new Set();
    reported.current = false;
    if (picked.length > 0) {
      setStage("minion");
      setQuestion(minionQuestion(picked[0], pool));
    } else {
      setStage("boss");
      setQuestion(bossQuestion(0, b, pool));
    }
    setPhase("fight");
  };

  const submit = (input: string) => {
    if (!question || !boss || reveal) return;
    const correct = isCorrect(question, input);
    setReveal({ correct, picked: input });
    playSound(correct ? "correct" : "wrong");
    if (stage === "minion") {
      const word = minions[results.length];
      setResults((r) => [...r, correct]);
      if (!correct && !missed.current.has(String(word.id))) {
        missed.current.add(String(word.id));
        onAnswer(word.id, false); // a miss goes into the review schedule
      }
    } else if (correct) {
      setDamage((d) => d + 1);
    }
    if (!correct) setHearts((h) => h - 1);
  };

  const next = () => {
    if (!boss) return;
    setReveal(null);
    setTyped("");
    if (hearts <= 0 || (stage === "boss" && damage >= BOSS_HP)) return setPhase("over");
    const pool = poolRef.current;
    if (stage === "minion" && results.length < minions.length) return setQuestion(minionQuestion(minions[results.length], pool));
    if (stage === "minion") {
      setStage("boss");
      return setQuestion(bossQuestion(damage, boss, pool));
    }
    setQuestion(bossQuestion(damage, boss, pool));
  };

  // Keyboard: 1-4 pick an option
  useEffect(() => {
    if (phase !== "fight" || !question || question.kind !== "choice" || reveal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < question.options.length) submit(question.options[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter moves on after an answer was shown
  useEffect(() => {
    if (phase !== "fight" || !reveal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !(e.target as HTMLElement | null)?.closest?.("button")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const outcome = useMemo(
    () => ({ won: hearts > 0 && damage >= BOSS_HP, heartsLeft: hearts, minionsDefeated: results.filter(Boolean).length, bossDamage: damage }),
    [hearts, damage, results]
  );

  useEffect(() => {
    if (phase !== "over" || reported.current || !boss) return;
    reported.current = true;
    const score = battleScore(outcome);
    const coins = battleCoins(outcome);
    setSummary({ score, coins, newBest: isNewBest(stats, "boss", score), won: outcome.won });
    recordGame({ game: "boss", score, coins });
    onAnswer(boss.id, outcome.won); // winning counts as a correct review of the boss card
    playSound(outcome.won ? "complete" : "wrong");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "intro") {
    return (
      <GameBox>
        <GameHeader title="Đấu trùm" onExit={onExit} />
        {candidates.length === 0 ? (
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Chưa có trùm nào. Những thẻ bạn hay trả lời sai (đặc biệt là thẻ “ngoan cố”) sẽ trở thành trùm. Hãy ôn tập thêm vài buổi rồi quay lại nhé!
          </p>
        ) : (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Vượt qua <b>{MINIONS} quái nhỏ</b> rồi hạ <b>trùm</b> bằng {BOSS_HP} đòn, mỗi đòn là một kiểu câu hỏi về cùng một từ. Bạn có {HEARTS} ❤️, mỗi lần sai mất một tim. Hạ được trùm thì thẻ đó được tính một lượt ôn đúng.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {candidates.map((c, i) => (
                <label
                  key={String(c.word.id)}
                  style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 10, cursor: "pointer", border: `2px solid ${i === chosen ? "#7c3aed" : "var(--border-color, #e2e8f0)"}` }}
                >
                  <input type="radio" name="boss" checked={i === chosen} onChange={() => setChosen(i)} />
                  <span style={{ fontSize: 26 }}>{bossEmoji(c.word)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{c.word.source}</b>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {c.leech ? "Trùm ngoan cố • " : ""}sai {c.word.wrongCount || 0} lần
                    </div>
                  </span>
                </label>
              ))}
            </div>
            <MyButton variant="primary" size="lg" onClick={() => selected && start(selected)}>
              ⚔️ Khiêu chiến
            </MyButton>
          </>
        )}
      </GameBox>
    );
  }

  if (phase === "over" && summary && boss) {
    return (
      <GameBox>
        <GameHeader title="Đấu trùm" onExit={onExit} />
        <GameResultCard
          emoji={summary.won ? "🏆" : "💀"}
          title={summary.won ? `Bạn đã hạ “${boss.source}”!` : `“${boss.source}” còn quá mạnh…`}
          lines={[
            ["Điểm", summary.score],
            ["Tim còn lại", Math.max(0, hearts)],
            ["Quái nhỏ", `${outcome.minionsDefeated}/${minions.length}`],
            ["Đòn vào trùm", `${damage}/${BOSS_HP}`]
          ]}
          coins={summary.coins}
          newBest={summary.newBest}
          note={
            <span style={{ fontSize: 13 }}>
              {firstMeaning(boss.target)} • {summary.won ? "đã tính một lượt ôn đúng cho trùm" : "đã ghi nhận để ôn lại"}
            </span>
          }
          onReplay={() => start({ word: boss, leech: isLeech(boss) })}
          replayLabel="Đấu lại"
          onExit={onExit}
        >
          {candidates.length > 1 && (
            <MyButton variant="ghost" size="sm" onClick={() => setPhase("intro")}>
              Chọn trùm khác
            </MyButton>
          )}
        </GameResultCard>
      </GameBox>
    );
  }

  if (!boss || !question) return null;

  const options = question.kind === "choice" ? question.options : [];
  const stateOf = (o: string): "idle" | "right" | "wrong" | "dim" => {
    if (!reveal || question.kind !== "choice") return "idle";
    if (o === question.answer) return "right";
    if (o === reveal.picked) return "wrong";
    return "dim";
  };
  const finishing = reveal && (hearts <= 0 || (stage === "boss" && damage >= BOSS_HP));

  return (
    <GameBox>
      <GameHeader title="Đấu trùm" onExit={onExit} />
      <Arena>
        <div className="top">
          <span className="hearts" aria-label={`${Math.max(0, hearts)} tim`}>
            {"❤️".repeat(Math.max(0, hearts))}
            {"🖤".repeat(HEARTS - Math.max(0, hearts))}
          </span>
          <span className="steps" aria-label="Tiến độ trận đấu">
            {minions.map((m, i) => (
              <span key={String(m.id)} className={`dot ${results[i] === undefined ? "" : results[i] ? "done" : "fail"}`} title={`Quái nhỏ ${i + 1}`} />
            ))}
            <span>→ 👑</span>
          </span>
        </div>
        <div className="boss">
          <span className="face" aria-hidden>
            {bossEmoji(boss)}
          </span>
          <div style={{ flex: 1 }}>
            <b>{boss.source}</b>
            <div className="hp" aria-label={`Máu trùm ${BOSS_HP - damage}/${BOSS_HP}`}>
              {Array.from({ length: BOSS_HP }, (_, i) => (
                <span key={i} className={i < BOSS_HP - damage ? "" : "gone"} />
              ))}
            </div>
          </div>
        </div>

        <Card>
          <div className="label">{question.label}</div>
          <div className="prompt">{question.prompt}</div>
          <div className="q">{question.question}</div>
        </Card>

        {question.kind === "choice" ? (
          <Options>
            {options.map((o, i) => (
              <Option key={o} $state={stateOf(o)} disabled={Boolean(reveal)} onClick={() => submit(o)}>
                <kbd>{i + 1}</kbd>
                {o}
              </Option>
            ))}
          </Options>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) submit(typed);
            }}
            style={{ display: "flex", gap: 8, flexDirection: "column" }}
          >
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={Boolean(reveal)}
              placeholder={question.hint}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Gõ đáp án"
              style={{ padding: "12px 14px", fontSize: 18, borderRadius: 10, border: "2px solid var(--border-color, #cbd5e1)", background: "var(--bg-primary)", color: "inherit", textAlign: "center" }}
            />
            {!reveal && (
              <MyButton variant="primary" type="submit" disabled={!typed.trim()}>
                Tấn công
              </MyButton>
            )}
          </form>
        )}

        {reveal && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite">
            <b style={{ color: reveal.correct ? "#059669" : "#dc2626" }}>
              {reveal.correct ? (stage === "boss" ? "💥 Trúng đòn!" : "✓ Chính xác!") : `✗ Sai rồi. Đáp án: ${question.answer}`}
            </b>
            <div>
              <MyButton variant="primary" onClick={next}>
                {finishing ? "Xem kết quả" : "Tiếp tục"}
              </MyButton>
            </div>
          </div>
        )}
      </Arena>
    </GameBox>
  );
}
