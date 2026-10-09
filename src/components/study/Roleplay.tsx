import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { MyInput, MyTextarea } from "components/MyInput";
import useAIJob from "hooks/useAIJob";
import AICancelDialog from "components/ai/AICancelDialog";
import RequireAI from "components/ai/RequireAI";
import { CardLoader } from "components/Loader";
import { AIConfig, askAIJson } from "utils/ai";
import { baseFormSync, prefetch } from "utils/localDict";
import { WordItem } from "types";
import {
  SCENARIOS,
  MAX_TURNS,
  MAX_TARGET_WORDS,
  ChatMessage,
  TurnResult,
  pickTargetWords,
  buildSystemPrompt,
  buildTurnPrompt,
  findUsedWords
} from "utils/roleplay";
import { StudyModeProps, ModeWrap, ModeCard, ModeMeta, useStableWords } from "./shared";

const Chat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-height: 46vh;
  overflow-y: auto;
  text-align: left;
`;

const Bubble = styled.div<{ $me: boolean }>`
  align-self: ${(p) => (p.$me ? "flex-end" : "flex-start")};
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 15px;
  line-height: 1.5;
  background: ${(p) => (p.$me ? "#3b82f6" : "var(--bg-tertiary, #f1f5f9)")};
  color: ${(p) => (p.$me ? "#fff" : "inherit")};

  .note {
    margin-top: 6px;
    font-size: 12.5px;
    opacity: 0.9;
  }
`;

const Chip = styled.span<{ $done: boolean }>`
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid ${(p) => (p.$done ? "#10b981" : "var(--border-color, #cbd5e1)")};
  background: ${(p) => (p.$done ? "rgba(16, 185, 129, 0.15)" : "transparent")};
  text-decoration: ${(p) => (p.$done ? "line-through" : "none")};
`;

const ScenarioBtn = styled.button<{ $active: boolean }>`
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
  border: 2px solid ${(p) => (p.$active ? "#3b82f6" : "var(--border-color, #e2e8f0)")};
  background: ${(p) => (p.$active ? "rgba(59, 130, 246, 0.1)" : "transparent")};
`;

interface Line extends ChatMessage {
  correction?: string | null;
  improved?: string | null;
}

function Session({ config, words: liveWords, onAnswer }: StudyModeProps & { config: AIConfig }) {
  const words = useStableWords(liveWords);
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [custom, setCustom] = useState("");
  const [targets, setTargets] = useState<WordItem[]>(() => pickTargetWords(words));
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [turns, setTurns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const job = useAIJob();
  const endRef = useRef<HTMLDivElement>(null);

  const situation = custom.trim() || SCENARIOS.find((s) => s.id === scenarioId)!.setup;
  const system = useMemo(() => buildSystemPrompt(situation, targets), [situation, targets]);
  const finished = turns >= MAX_TURNS;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [lines.length, job.busy]);

  const reroll = () => setTargets(pickTargetWords(words));

  const start = async () => {
    setError(null);
    setLines([]);
    setUsed(new Set());
    setTurns(0);
    setStarted(true);
    try {
      await prefetch(targets.map((w) => w.source)).catch(() => {});
      const res = await job.run((signal) => askAIJson<TurnResult>(buildTurnPrompt([]), config, { system, maxTokens: 500, signal }));
      if (res === undefined) return setStarted(false);
      setLines([{ role: "ai", text: res.reply }]);
    } catch (err: any) {
      setError(err?.message || "AI thất bại");
      setStarted(false);
    }
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || job.busy || finished) return;
    setError(null);
    const history: ChatMessage[] = lines.map(({ role, text }) => ({ role, text }));
    const userLine: Line = { role: "user", text: message };
    setLines((l) => [...l, userLine]);
    setDraft("");
    try {
      await prefetch([...message.match(/[A-Za-z]+/g) || [], ...targets.map((w) => w.source)]).catch(() => {});
      const res = await job.run((signal) => askAIJson<TurnResult>(buildTurnPrompt(history, message), config, { system, maxTokens: 600, signal }));
      if (res === undefined) {
        setLines((l) => l.filter((x) => x !== userLine));
        setDraft(message);
        return;
      }
      const misused = new Set((res.misused || []).map((m) => String(m).toLowerCase()));
      const hits = findUsedWords(message, targets, baseFormSync);
      const next = new Set(used);
      hits.forEach((w) => {
        if (misused.has(w.source.toLowerCase())) {
          onAnswer(w.id, false);
        } else if (!next.has(String(w.id))) {
          next.add(String(w.id));
          onAnswer(w.id, true);
        }
      });
      setUsed(next);
      setTurns((t) => t + 1);
      setLines((l) => [
        ...l.map((x) => (x === userLine ? { ...x, correction: res.correction, improved: res.improved } : x)),
        { role: "ai", text: res.reply }
      ]);
    } catch (err: any) {
      setError(err?.message || "AI thất bại");
      setLines((l) => l.filter((x) => x !== userLine));
      setDraft(message);
    }
  };

  const reset = () => {
    setStarted(false);
    setLines([]);
    setTargets(pickTargetWords(words));
  };

  if (words.length === 0) return <ModeCard>Bộ thẻ chưa có từ nào để luyện hội thoại.</ModeCard>;

  if (!started) {
    return (
      <ModeWrap>
        <ModeCard style={{ alignItems: "stretch", textAlign: "left" }}>
          <h3 style={{ margin: 0 }}>Hội thoại nhập vai với AI</h3>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>
            Chọn một tình huống. AI sẽ trò chuyện bằng tiếng Anh và dẫn dắt để bạn dùng các từ trong bộ thẻ. Từ nào bạn dùng đúng sẽ được tính là một lượt ôn.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
            {SCENARIOS.map((s) => (
              <ScenarioBtn key={s.id} $active={!custom.trim() && scenarioId === s.id} onClick={() => { setScenarioId(s.id); setCustom(""); }}>
                {s.icon} {s.title}
              </ScenarioBtn>
            ))}
          </div>
          <MyInput value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Hoặc tự mô tả tình huống (bằng tiếng Anh hoặc tiếng Việt)..." maxLength={200} />
          <div>
            <div style={{ fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>
              Từ mục tiêu ({targets.length}/{MAX_TARGET_WORDS}) — ưu tiên các từ bạn hay sai:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {targets.map((w) => (
                <Chip key={w.id} $done={false} title={w.target}>
                  {w.source}
                </Chip>
              ))}
            </div>
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <MyButton variant="ghost" onClick={reroll}>
              Chọn lại từ
            </MyButton>
            <MyButton variant="primary" onClick={start} disabled={targets.length === 0}>
              Bắt đầu trò chuyện
            </MyButton>
          </div>
        </ModeCard>
      </ModeWrap>
    );
  }

  return (
    <ModeWrap>
      <ModeMeta>
        <span>
          Lượt {Math.min(turns + 1, MAX_TURNS)}/{MAX_TURNS}
        </span>
        <span>
          Đã dùng {used.size}/{targets.length} từ
        </span>
      </ModeMeta>
      <ModeCard style={{ alignItems: "stretch" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {targets.map((w) => (
            <Chip key={w.id} $done={used.has(String(w.id))} title={w.target}>
              {w.source}
            </Chip>
          ))}
        </div>
        <Chat>
          {lines.map((l, i) => (
            <Bubble key={i} $me={l.role === "user"}>
              {l.text}
              {l.role === "user" && l.correction && <div className="note">✏️ {l.correction}</div>}
              {l.role === "user" && l.improved && l.improved.trim() !== l.text.trim() && (
                <div className="note">
                  Gợi ý: <em>{l.improved}</em>
                </div>
              )}
            </Bubble>
          ))}
          {job.busy && <CardLoader compact label="AI đang trả lời" />}
          <div ref={endRef} />
        </Chat>
        <AICancelDialog job={job} />
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
        {finished ? (
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "4px 0" }}>
              Kết thúc! Bạn đã dùng {used.size}/{targets.length} từ mục tiêu
            </h3>
            {used.size < targets.length && (
              <p style={{ margin: "4px 0 10px", fontSize: 13, color: "var(--text-secondary)" }}>
                Chưa dùng: {targets.filter((w) => !used.has(String(w.id))).map((w) => w.source).join(", ")}
              </p>
            )}
            <MyButton variant="primary" onClick={reset}>
              Hội thoại mới
            </MyButton>
          </div>
        ) : (
          <>
            <MyTextarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Trả lời bằng tiếng Anh (Enter để gửi)..."
              style={{ minHeight: 70, width: "100%" }}
              disabled={job.busy || lines.length === 0}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <MyButton variant="ghost" onClick={reset}>
                Kết thúc sớm
              </MyButton>
              {job.busy ? (
                <MyButton variant="danger" onClick={() => job.requestCancel()}>
                  Hủy yêu cầu AI
                </MyButton>
              ) : (
                <MyButton variant="primary" onClick={send} disabled={!draft.trim() || lines.length === 0}>
                  Gửi
                </MyButton>
              )}
            </div>
          </>
        )}
      </ModeCard>
    </ModeWrap>
  );
}

/** Free conversation with the user's AI, steered towards the deck's words. */
export default function Roleplay(props: StudyModeProps) {
  return <RequireAI>{(config) => <Session {...props} config={config} />}</RequireAI>;
}
