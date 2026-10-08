import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import useCollectionContext from "contexts/Collection";
import ActivityHeatmap from "components/ActivityHeatmap";
import { PageContainer, Panel, MutedText } from "components/ui";
import { daysAgoKey, dayOfWeek } from "utils/dates";
import { computeBadges } from "utils/badges";
import { isLeech } from "utils/plan";
import MyButton from "components/MyButton";

const Cols = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .box {
    padding: 14px;
    border-radius: 12px;
    background: var(--bg-tertiary, #f1f5f9);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .value {
    font-size: 24px;
    font-weight: 800;
  }

  .label {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
`;

const HardRow = styled(Link)`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color, #e2e8f0);
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }

  .count {
    color: #ef4444;
    font-weight: 700;
    white-space: nowrap;
  }

  .meta {
    color: var(--text-muted, #94a3b8);
    font-size: 12px;
  }
`;

const BadgeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
`;

const BadgeCard = styled.div<{ $earned: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1px solid ${(p) => (p.$earned ? "#f59e0b" : "var(--border-color, #e2e8f0)")};
  background: ${(p) => (p.$earned ? "rgba(245, 158, 11, 0.1)" : "transparent")};
  opacity: ${(p) => (p.$earned ? 1 : 0.5)};
  filter: ${(p) => (p.$earned ? "none" : "grayscale(1)")};

  .icon {
    font-size: 28px;
  }
  .title {
    font-weight: 700;
    font-size: 13px;
  }
  .desc {
    font-size: 11.5px;
    color: var(--text-secondary, #64748b);
  }
`;

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function StatsPage() {
  const { collections, stats, settings } = useCollectionContext();
  const navigate = useNavigate();
  const goal = settings.dailyGoal || 20;
  const log = useMemo(() => stats.reviewLog || {}, [stats.reviewLog]);

  const words = useMemo(
    () => collections.flatMap((c) => c.words.map((w) => ({ ...w, collection: c })) ),
    [collections]
  );
  const counts = useMemo(
    () => ({
      total: words.length,
      mastered: words.filter((w) => w.status === "mastered").length,
      learning: words.filter((w) => w.status === "learning").length,
      fresh: words.filter((w) => !w.status || w.status === "new").length
    }),
    [words]
  );

  const week = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key = daysAgoKey(i);
      days.push({ key, label: DAY_LABELS[dayOfWeek(key)], count: log[key] || 0 });
    }
    return days;
  }, [log]);
  const weekMax = Math.max(goal, ...week.map((d) => d.count), 1);
  const weekTotal = week.reduce((a, d) => a + d.count, 0);

  const leechCount = useMemo(() => words.filter(isLeech).length, [words]);

  const hardWords = useMemo(
    () =>
      words
        .filter((w) => (w.wrongCount || 0) > 0)
        .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
        .slice(0, 15),
    [words]
  );

  const badges = useMemo(() => computeBadges(stats, collections), [stats, collections]);

  const pct = (n: number) => (counts.total ? Math.round((n / counts.total) * 100) : 0);

  return (
    <PageContainer>
      <Panel>
        <h2>Thống kê học tập</h2>
        <Cols>
          <div className="box">
            <span className="value">{stats.studyStreakDays}</span>
            <span className="label">Ngày liên tiếp</span>
          </div>
          <div className="box">
            <span className="value">{stats.totalCardsReviewed}</span>
            <span className="label">Lượt ôn tổng</span>
          </div>
          <div className="box">
            <span className="value">{weekTotal}</span>
            <span className="label">Lượt ôn 7 ngày</span>
          </div>
          <div className="box">
            <span className="value">{pct(counts.mastered)}%</span>
            <span className="label">Đã thuộc ({counts.mastered}/{counts.total})</span>
          </div>
        </Cols>
      </Panel>

      <Panel>
        <h3>7 ngày gần nhất (mục tiêu {goal} thẻ/ngày)</h3>
        <svg viewBox="0 0 350 140" width="100%" role="img" aria-label="Biểu đồ số thẻ ôn 7 ngày gần nhất">
          <line x1="0" x2="350" y1={110 - (goal / weekMax) * 90} y2={110 - (goal / weekMax) * 90} stroke="#f59e0b" strokeDasharray="4 4" />
          {week.map((d, i) => {
            const h = (d.count / weekMax) * 90;
            const x = i * 50 + 10;
            return (
              <g key={d.key}>
                <rect x={x} y={110 - h} width="30" height={Math.max(h, 1)} rx="4" fill={d.count >= goal ? "#10b981" : "#3b82f6"}>
                  <title>{`${d.key}: ${d.count} thẻ`}</title>
                </rect>
                <text x={x + 15} y={104 - h} textAnchor="middle" fontSize="10" fill="currentColor">
                  {d.count || ""}
                </text>
                <text x={x + 15} y="128" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Panel>

      <Panel>
        <h3>Hoạt động 18 tuần</h3>
        <ActivityHeatmap log={log} goal={goal} />
      </Panel>

      <Panel>
        <h3>Phân bố mức độ ghi nhớ</h3>
        <div style={{ display: "flex", height: 14, borderRadius: 9999, overflow: "hidden", background: "var(--bg-tertiary)" }}>
          <div style={{ width: `${pct(counts.mastered)}%`, background: "#10b981" }} title="Đã thuộc" />
          <div style={{ width: `${pct(counts.learning)}%`, background: "#f59e0b" }} title="Đang học" />
          <div style={{ width: `${pct(counts.fresh)}%`, background: "#94a3b8" }} title="Chưa ôn" />
        </div>
        <MutedText style={{ marginTop: 8 }}>
          Đã thuộc {counts.mastered} • Đang học {counts.learning} • Chưa ôn {counts.fresh}
        </MutedText>
      </Panel>

      <Panel>
        <h3>
          Huy hiệu ({badges.filter((b) => b.earned).length}/{badges.length})
        </h3>
        <BadgeGrid>
          {badges.map((b) => (
            <BadgeCard key={b.id} $earned={b.earned} title={b.description}>
              <span className="icon">{b.icon}</span>
              <span className="title">{b.title}</span>
              <span className="desc">{b.earned ? b.description : `${b.description} (${b.progress})`}</span>
            </BadgeCard>
          ))}
        </BadgeGrid>
      </Panel>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Từ hay sai nhất</h3>
          {leechCount > 0 && (
            <MyButton variant="outline" size="sm" onClick={() => navigate("/review?leech=1")}>
              Luyện {leechCount} thẻ ngoan cố →
            </MyButton>
          )}
        </div>
        {hardWords.length === 0 ? (
          <MutedText>Chưa có từ nào bị sai. Hãy làm vài bài ôn tập hoặc trắc nghiệm!</MutedText>
        ) : (
          hardWords.map((w) => (
            <HardRow key={`${w.collection.pathname}-${w.id}`} to={`/collections/${w.collection.pathname}`}>
              <span>
                <strong>{w.source}</strong> — {w.target}
                <div className="meta">{w.collection.name}</div>
              </span>
              <span className="count">
                {isLeech(w) && "⚠ "}sai {w.wrongCount} lần
              </span>
            </HardRow>
          ))
        )}
      </Panel>
    </PageContainer>
  );
}
