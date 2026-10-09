import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { CardLoader } from "components/Loader";
import useCollectionContext from "contexts/Collection";
import { WordItem } from "types";
import { dateKey } from "utils/dates";
import { loadTopWords } from "utils/localDict";
import { playSound } from "utils/sound";
import {
  LetterState,
  WORDLE_ATTEMPTS,
  DAILY_LENGTH,
  evaluateGuess,
  keyboardStates,
  gridOf,
  shareText,
  pickDailyWord,
  wordleWords,
  wordleCoins,
  wordleScore,
  isNewBest,
  profileOf,
  dailyStreak,
  shuffle
} from "utils/games";
import { GameBox, GameHeader, GameResultCard } from "./GameKit";

const COLORS: Record<LetterState | "empty", string> = {
  correct: "#10b981",
  present: "#f59e0b",
  absent: "#64748b",
  empty: "transparent"
};

const Board = styled.div<{ $cols: number }>`
  display: grid;
  gap: 6px;
  margin: 0 auto;
  width: 100%;
  max-width: ${(p) => p.$cols * 62}px;

  .row {
    display: grid;
    grid-template-columns: repeat(${(p) => p.$cols}, 1fr);
    gap: 6px;
  }
`;

const Tile = styled.div<{ $state: LetterState | "empty"; $filled: boolean; $delay: number }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(20px, 6vw, 28px);
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 8px;
  border: 2px solid ${(p) => (p.$state === "empty" ? (p.$filled ? "var(--text-muted, #94a3b8)" : "var(--border-color, #cbd5e1)") : COLORS[p.$state])};
  background: ${(p) => COLORS[p.$state]};
  color: ${(p) => (p.$state === "empty" ? "inherit" : "#fff")};
  transition: background 0.3s ease ${(p) => p.$delay}ms, border-color 0.3s ease ${(p) => p.$delay}ms;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Keys = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;

  .krow {
    display: flex;
    gap: 5px;
    justify-content: center;
    width: 100%;
  }
`;

const Key = styled.button<{ $state?: LetterState; $wide?: boolean }>`
  flex: ${(p) => (p.$wide ? 1.6 : 1)};
  max-width: ${(p) => (p.$wide ? 64 : 40)}px;
  height: 46px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  background: ${(p) => (p.$state ? COLORS[p.$state] : "var(--bg-tertiary, #e2e8f0)")};
  color: ${(p) => (p.$state ? "#fff" : "inherit")};
`;

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

interface Target {
  word: string;
  meaning: string;
  phonetic?: string;
  id?: string | number;
}

interface Props {
  mode: "daily" | "deck";
  words: WordItem[]; // deck cards (deck mode)
  onAnswer: (wordId: string | number, correct: boolean) => void;
  onExit: () => void;
}

const progressKey = (day: string) => `memcard_wordle_${day}`;

function readProgress(day: string): { rows: string[]; hint: boolean } | null {
  try {
    const raw = localStorage.getItem(progressKey(day));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data.rows)) return { rows: data.rows.filter((r: unknown) => typeof r === "string"), hint: Boolean(data.hint) };
  } catch {}
  return null;
}

/** Guess the English word from its Vietnamese meaning. Daily mode: everyone gets the same word. */
export default function Wordle({ mode, words, onAnswer, onExit }: Props) {
  const { stats, recordGame } = useCollectionContext();
  const today = dateKey();
  const daily = mode === "daily";
  const done = daily ? profileOf(stats).daily[today] : undefined;

  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rows, setRows] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [hint, setHint] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ coins: number; newBest: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const reported = useRef(false);

  // Pick the word. Deck words are taken once so answering (which updates review stats) doesn't change the board.
  const wordsRef = useRef(words);
  wordsRef.current = words;
  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setCurrent("");
    setHint(false);
    setSummary(null);
    setMessage(null);
    reported.current = false;
    if (daily) {
      setTarget(null);
      loadTopWords().then((top) => {
        if (cancelled) return;
        const e = pickDailyWord(top, today);
        if (!e) return setLoadError(true);
        setTarget({ word: e.word, meaning: e.vi, phonetic: e.ipa ? `/${e.ipa}/` : undefined });
        const saved = readProgress(today);
        if (saved) {
          setRows(saved.rows);
          setHint(saved.hint);
        }
      });
    } else {
      const pick = shuffle(wordleWords(wordsRef.current))[0];
      if (!pick) return setLoadError(true);
      setTarget({ word: pick.source.trim().toLowerCase(), meaning: pick.target, phonetic: pick.phonetic, id: pick.id });
    }
    return () => {
      cancelled = true;
    };
  }, [daily, today, round]);

  const answer = target?.word || "";
  const len = answer.length || DAILY_LENGTH;
  const evaluated = useMemo(() => rows.map((g) => ({ guess: g, states: evaluateGuess(g, answer) })), [rows, answer]);
  const won = rows.length > 0 && rows[rows.length - 1] === answer;
  const lost = !won && rows.length >= WORDLE_ATTEMPTS;
  const finished = won || lost;
  const keyStates = useMemo(() => keyboardStates(evaluated), [evaluated]);

  // Keep a daily game in progress across reloads
  useEffect(() => {
    if (!daily || !target || done) return;
    try {
      localStorage.setItem(progressKey(today), JSON.stringify({ rows, hint }));
    } catch {}
  }, [daily, target, rows, hint, today, done]);

  // Report the finished game once
  useEffect(() => {
    if (!target || !finished || reported.current || done) return;
    reported.current = true;
    const coins = wordleCoins({ won, guesses: rows.length, hint, daily });
    const score = wordleScore(won, rows.length, hint);
    const key = daily ? "wordle-daily" : "wordle";
    setSummary({ coins, newBest: isNewBest(stats, key, score) });
    recordGame({
      game: key,
      score,
      coins,
      daily: daily ? { date: today, result: { won, guesses: rows.length, grid: gridOf(evaluated.map((e) => e.states)) } } : undefined
    });
    if (!daily && target.id !== undefined) onAnswer(target.id, won);
    playSound(won ? "complete" : "wrong");
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((m) => (m === text ? null : m)), 1600);
  }, []);

  const submit = useCallback(() => {
    if (!target || finished) return;
    if (current.length !== len) return flash(`Cần đủ ${len} chữ cái`);
    setRows((r) => [...r, current]);
    setCurrent("");
    playSound("flip");
  }, [target, finished, current, len, flash]);

  const type = useCallback(
    (ch: string) => {
      if (!target || finished) return;
      setCurrent((c) => (c.length < len ? c + ch : c));
    },
    [target, finished, len]
  );

  const backspace = useCallback(() => setCurrent((c) => c.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Enter on a focused button should press that button, not submit the guess
      if (e.key === "Enter" && (e.target as HTMLElement | null)?.closest?.("button")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, backspace, type]);

  const title = daily ? "Đoán chữ hằng ngày" : "Đoán chữ";
  const streak = dailyStreak(profileOf(stats).daily, today);

  if (loadError) {
    return (
      <GameBox>
        <GameHeader title={title} onExit={onExit} />
        <p style={{ margin: 0 }}>
          {daily ? "Không tải được từ điển offline để chọn từ của hôm nay." : "Bộ thẻ này chưa có từ đơn (3–8 chữ cái) để chơi. Hãy chọn bộ khác hoặc thêm từ."}
        </p>
      </GameBox>
    );
  }
  if (!target) {
    return (
      <GameBox>
        <GameHeader title={title} onExit={onExit} />
        <CardLoader compact label="Đang chọn từ" />
      </GameBox>
    );
  }

  // Already played today's challenge
  if (done && !summary) {
    const text = shareText(today, done.won, done.guesses, done.grid);
    return (
      <GameBox>
        <GameHeader title={title} onExit={onExit} />
        <GameResultCard
          emoji={done.won ? "🎉" : "😅"}
          title={done.won ? `Bạn đoán đúng sau ${done.guesses} lượt` : "Hôm nay chưa đoán được"}
          lines={[["Chuỗi thắng", streak], ["Từ hôm nay", answer.toUpperCase()]]}
          coins={0}
          note={<span style={{ fontSize: 13 }}>{target.meaning}</span>}
          onExit={onExit}
        >
          <pre style={{ margin: 0, lineHeight: 1.3 }}>{done.grid}</pre>
          <MyButton
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
              } catch {
                flash("Không sao chép được");
              }
            }}
          >
            {copied ? "Đã sao chép!" : "Chia sẻ kết quả"}
          </MyButton>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Từ mới sẽ có vào ngày mai.</span>
        </GameResultCard>
      </GameBox>
    );
  }

  const gridRows = Array.from({ length: WORDLE_ATTEMPTS }, (_, i) => {
    if (i < rows.length) return { letters: rows[i], states: evaluated[i].states, submitted: true };
    if (i === rows.length) return { letters: current, states: [] as LetterState[], submitted: false };
    return { letters: "", states: [] as LetterState[], submitted: false };
  });

  return (
    <GameBox>
      <GameHeader title={title} onExit={onExit} meta={<span>{rows.length}/{WORDLE_ATTEMPTS} lượt</span>} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nghĩa tiếng Việt ({len} chữ cái)</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{target.meaning}</div>
        {hint && <div style={{ fontSize: 14 }}>Chữ đầu: <b>{answer[0].toUpperCase()}</b>{target.phonetic ? ` • ${target.phonetic}` : ""}</div>}
      </div>

      <Board $cols={len} aria-label="Bảng đoán chữ">
        {gridRows.map((r, i) => (
          <div className="row" key={i}>
            {Array.from({ length: len }, (_, j) => (
              <Tile key={j} $state={r.submitted ? r.states[j] : "empty"} $filled={Boolean(r.letters[j])} $delay={j * 120}>
                {r.letters[j] || ""}
              </Tile>
            ))}
          </div>
        ))}
      </Board>

      <div style={{ minHeight: 20, textAlign: "center", fontSize: 13, color: "#b45309" }}>{message}</div>

      {finished ? (
        <GameResultCard
          emoji={won ? "🎉" : "😅"}
          title={won ? `Đúng rồi! Bạn đoán ra sau ${rows.length} lượt` : `Đáp án là “${answer}”`}
          lines={[
            ["Từ", answer.toUpperCase()],
            ...(daily ? ([["Chuỗi thắng", dailyStreak({ ...profileOf(stats).daily, [today]: { won, guesses: rows.length, grid: "" } }, today)]] as [string, number][]) : [])
          ]}
          coins={summary?.coins ?? 0}
          newBest={summary?.newBest}
          note={
            <span style={{ fontSize: 13 }}>
              {target.meaning}
              {!daily && target.id !== undefined ? (won ? " • đã tính một lượt ôn đúng" : " • đã ghi nhận để ôn lại") : ""}
            </span>
          }
          onReplay={daily ? undefined : () => setRound((r) => r + 1)}
          replayLabel="Từ khác"
          onExit={onExit}
        >
          {daily && (
            <MyButton
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareText(today, won, rows.length, gridOf(evaluated.map((e) => e.states))));
                  setCopied(true);
                } catch {
                  flash("Không sao chép được");
                }
              }}
            >
              {copied ? "Đã sao chép!" : "Chia sẻ kết quả"}
            </MyButton>
          )}
        </GameResultCard>
      ) : (
        <>
          <Keys>
            {ROWS.map((row, ri) => (
              <div className="krow" key={row}>
                {ri === 2 && (
                  <Key $wide onClick={submit} aria-label="Gửi">
                    Enter
                  </Key>
                )}
                {row.split("").map((ch) => (
                  <Key key={ch} $state={keyStates[ch]} onClick={() => type(ch)}>
                    {ch}
                  </Key>
                ))}
                {ri === 2 && (
                  <Key $wide onClick={backspace} aria-label="Xóa">
                    ⌫
                  </Key>
                )}
              </div>
            ))}
          </Keys>
          {!hint && (
            <div style={{ textAlign: "center" }}>
              <MyButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  (e.currentTarget as HTMLElement).blur();
                  setHint(true);
                }}
              >
                💡 Gợi ý chữ đầu (−2 xu)
              </MyButton>
            </div>
          )}
        </>
      )}
    </GameBox>
  );
}
