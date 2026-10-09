import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import LessonView from "components/grammar/LessonView";
import PracticeRunner from "components/grammar/PracticeRunner";
import { PageContainer, Panel, MutedText } from "components/ui";
import { TOPICS, topicById, topicsOf } from "data/grammar";
import {
  LEVELS,
  LEVEL_NAMES,
  GLevel,
  GrammarTopic,
  SessionItem,
  MASTERED_SCORE,
  topicSession,
  reviewSession,
  topicStatus,
  TopicStatus,
  dueTopics,
  solvedSentence,
  masteredCount
} from "utils/grammar";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
`;

const TopicCard = styled(Link)<{ $status: TopicStatus }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${(p) => (p.$status === "due" ? "#f59e0b" : p.$status === "mastered" ? "#10b981" : "var(--border-color, #e2e8f0)")};
  background: var(--bg-card, #fff);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover, 0 8px 20px rgba(0, 0, 0, 0.08));
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .level {
    font-size: 11px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--bg-tertiary, #f1f5f9);
  }
  .title {
    font-weight: 800;
    font-size: 15px;
    line-height: 1.3;
  }
  .vi {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
    line-height: 1.4;
    flex: 1;
  }
  .status {
    font-size: 12px;
    font-weight: 700;
  }
`;

const STATUS_TEXT: Record<TopicStatus, string> = { new: "Chưa học", learning: "Đang học", mastered: "✓ Đã nắm", due: "⟳ Cần ôn lại" };
const STATUS_COLOR: Record<TopicStatus, string> = { new: "var(--text-muted, #94a3b8)", learning: "#3b82f6", mastered: "#059669", due: "#d97706" };

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

type View = "lesson" | "practice" | "result";

interface Finished {
  items: SessionItem[];
  results: { id: string; topicId: string; correct: boolean }[];
}

function Result({ finished, onAgain, onLesson, onNext, onHome }: { finished: Finished; onAgain: () => void; onLesson?: () => void; onNext?: () => void; onHome: () => void }) {
  const correct = finished.results.filter((r) => r.correct).length;
  const total = finished.results.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const wrong = finished.results.filter((r) => !r.correct);
  const byId = new Map(finished.items.map((i) => [i.id, i]));
  return (
    <Panel style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }} role="status">
        <div style={{ fontSize: 44 }}>{pct >= 90 ? "🏆" : pct >= MASTERED_SCORE ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h2 style={{ margin: 0 }}>
          {correct}/{total} câu đúng ({pct}%)
        </h2>
        <MutedText>
          {pct >= MASTERED_SCORE
            ? "Chủ điểm này bạn đã nắm vững. Hệ thống sẽ nhắc ôn lại sau vài ngày để nhớ lâu."
            : "Chưa đạt 80%. Hãy đọc lại bài học và các câu sai bên dưới, rồi thử lại. Những câu sai sẽ được ưu tiên ở lần sau."}
        </MutedText>
      </div>

      {wrong.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Những câu cần xem lại</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wrong.map((w) => {
              const item = byId.get(w.id)!;
              return (
                <div key={w.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--bg-tertiary, #f1f5f9)", fontSize: 14, lineHeight: 1.5 }}>
                  <b>{solvedSentence(item.exercise)}</b>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{item.exercise.explain}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
        <MyButton variant="primary" onClick={onAgain}>
          Làm lại
        </MyButton>
        {onLesson && (
          <MyButton variant="secondary" onClick={onLesson}>
            Đọc lại bài học
          </MyButton>
        )}
        {onNext && (
          <MyButton variant="secondary" onClick={onNext}>
            Chủ điểm tiếp theo →
          </MyButton>
        )}
        <MyButton variant="ghost" onClick={onHome}>
          Danh sách chủ điểm
        </MyButton>
      </div>
    </Panel>
  );
}

function Home() {
  const { stats } = useCollectionContext();
  const navigate = useNavigate();
  const [level, setLevel] = useState<GLevel | "ALL">("ALL");
  const now = Date.now();
  const progress = stats.grammar;
  const list = level === "ALL" ? TOPICS : topicsOf(level);
  const due = useMemo(() => dueTopics(TOPICS, progress, now), [progress]); // eslint-disable-line react-hooks/exhaustive-deps
  const missed = Object.values(progress || {}).reduce((a, p) => a + p.wrong.length, 0);
  const mastered = masteredCount(progress);
  const needReview = due.length > 0 || missed > 0;

  return (
    <PageContainer>
      <Panel>
        <h2 style={{ margin: "0 0 4px" }}>Ngữ pháp</h2>
        <MutedText>
          {TOPICS.length} chủ điểm từ A1 đến C2, giải thích bằng tiếng Việt kèm bài tập có chấm điểm và giải thích từng câu. Mỗi bài luyện tập tính vào chuỗi ngày học và XP của bạn.
        </MutedText>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          <div>
            <b style={{ fontSize: 22 }}>
              {mastered}/{TOPICS.length}
            </b>
            <MutedText>chủ điểm đã nắm (từ 80%)</MutedText>
          </div>
          <div>
            <b style={{ fontSize: 22 }}>{due.length}</b>
            <MutedText>chủ điểm cần ôn lại</MutedText>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <MyButton variant={needReview ? "primary" : "secondary"} disabled={!needReview} onClick={() => navigate("/grammar/review")} title={needReview ? undefined : "Chưa có gì cần ôn. Hãy học thêm chủ điểm mới!"}>
              🔁 Ôn ngữ pháp hôm nay{missed > 0 ? ` (${missed} câu sai)` : ""}
            </MyButton>
          </div>
        </div>
      </Panel>

      <Tabs aria-label="Chọn trình độ">
        {(["ALL", ...LEVELS] as (GLevel | "ALL")[]).map((l) => (
          <MyButton key={l} size="sm" variant={level === l ? "primary" : "secondary"} onClick={() => setLevel(l)}>
            {l === "ALL" ? "Tất cả" : `${l} • ${LEVEL_NAMES[l]}`}
          </MyButton>
        ))}
      </Tabs>

      <Grid>
        {list.map((t) => {
          const p = progress?.[t.id];
          const status = topicStatus(p, now);
          return (
            <TopicCard key={t.id} to={`/grammar/${t.id}`} $status={status}>
              <div className="row">
                <span className="level">{t.level}</span>
                <span className="status" style={{ color: STATUS_COLOR[status] }}>
                  {STATUS_TEXT[status]}
                  {p && p.attempts > 0 ? ` • ${p.best}%` : ""}
                </span>
              </div>
              <div className="title">{t.title}</div>
              <div className="vi">{t.titleVi}</div>
            </TopicCard>
          );
        })}
      </Grid>
    </PageContainer>
  );
}

function TopicPage({ topic }: { topic: GrammarTopic }) {
  const { stats, recordGrammar } = useCollectionContext();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("lesson");
  const [session, setSession] = useState<SessionItem[]>([]);
  const [finished, setFinished] = useState<Finished | null>(null);
  const progress = stats.grammar?.[topic.id];
  const index = TOPICS.findIndex((t) => t.id === topic.id);
  const nextTopic = TOPICS[index + 1];

  const start = () => {
    setSession(topicSession(topic, progress?.wrong || []));
    setFinished(null);
    setView("practice");
    window.scrollTo?.({ top: 0 });
  };

  return (
    <PageContainer>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <MyButton variant="ghost" size="sm" onClick={() => navigate("/grammar")}>
          ← Danh sách chủ điểm
        </MyButton>
        <MutedText>
          {topic.level} • {LEVEL_NAMES[topic.level]}
          {progress && progress.attempts > 0 ? ` • điểm cao nhất ${progress.best}%` : ""}
        </MutedText>
      </div>
      <div>
        <h2 style={{ margin: 0 }}>{topic.title}</h2>
        <MutedText>{topic.titleVi}</MutedText>
      </div>

      {view !== "practice" && view !== "result" && (
        <Tabs>
          <MyButton size="sm" variant="primary">
            📖 Bài học
          </MyButton>
          <MyButton size="sm" variant="secondary" onClick={start}>
            ✏️ Luyện tập
          </MyButton>
        </Tabs>
      )}

      {view === "lesson" && <LessonView topic={topic} onPractice={start} />}

      {view === "practice" && (
        <PracticeRunner
          items={session}
          onExit={() => setView("lesson")}
          onFinish={(results) => {
            recordGrammar({ items: results });
            setFinished({ items: session, results });
            setView("result");
          }}
        />
      )}

      {view === "result" && finished && (
        <Result
          finished={finished}
          onAgain={start}
          onLesson={() => setView("lesson")}
          onNext={nextTopic ? () => navigate(`/grammar/${nextTopic.id}`) : undefined}
          onHome={() => navigate("/grammar")}
        />
      )}
    </PageContainer>
  );
}

function ReviewPage() {
  const { stats, recordGrammar } = useCollectionContext();
  const navigate = useNavigate();
  const [session] = useState<SessionItem[]>(() => reviewSession(TOPICS, stats.grammar));
  const [finished, setFinished] = useState<Finished | null>(null);
  const [round, setRound] = useState(0);

  if (session.length === 0) {
    return (
      <PageContainer>
        <Panel>
          <h2>Ôn ngữ pháp hôm nay</h2>
          <MutedText>Hôm nay chưa có gì cần ôn lại. Hãy học thêm một chủ điểm mới!</MutedText>
          <div style={{ marginTop: 12 }}>
            <MyButton variant="primary" onClick={() => navigate("/grammar")}>
              Xem danh sách chủ điểm
            </MyButton>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div>
        <h2 style={{ margin: 0 }}>Ôn ngữ pháp hôm nay</h2>
        <MutedText>Các câu bạn đã làm sai trước đó và những chủ điểm đến hạn ôn lại.</MutedText>
      </div>
      {!finished ? (
        <PracticeRunner
          key={round}
          items={session}
          mixed
          onExit={() => navigate("/grammar")}
          onFinish={(results) => {
            recordGrammar({ items: results });
            setFinished({ items: session, results });
          }}
        />
      ) : (
        <Result
          finished={finished}
          onAgain={() => {
            setFinished(null);
            setRound((r) => r + 1);
          }}
          onHome={() => navigate("/grammar")}
        />
      )}
    </PageContainer>
  );
}

export default function GrammarPage() {
  const { topicId } = useParams();
  if (!topicId) return <Home />;
  if (topicId === "review") return <ReviewPage />;
  const topic = topicById(topicId);
  if (!topic) {
    return (
      <PageContainer>
        <Panel>
          <h2>Không tìm thấy chủ điểm</h2>
          <Link to="/grammar">Về danh sách chủ điểm</Link>
        </Panel>
      </PageContainer>
    );
  }
  return <TopicPage key={topic.id} topic={topic} />;
}
