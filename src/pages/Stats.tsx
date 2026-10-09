import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import useCollectionContext from "contexts/Collection";
import ActivityHeatmap from "components/ActivityHeatmap";
import { PageContainer, Panel, MutedText } from "components/ui";
import { daysAgoKey, dayOfWeek } from "utils/dates";
import { computeBadges } from "utils/badges";
import { isLeech } from "utils/plan";
import MyButton from "components/MyButton";
import { buildForecast } from "utils/forecast";
import { weekProgress, MAX_FREEZES } from "utils/streak";
import { bestHour, hourSlots, hourToTime, MIN_REVIEWS_FOR_ADVICE } from "utils/studyHours";
import { levelInfo, xpOf } from "utils/xp";
import { Period, PERIOD_DAYS, PERIOD_LABEL, buildReport, changePct, reportText } from "utils/report";

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
  const { collections, stats, settings, updateSettings } = useCollectionContext();
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

  const badges = useMemo(() => computeBadges(stats, collections, goal), [stats, collections, goal]);

  const forecast = useMemo(() => buildForecast(collections, 14), [collections]);
  const forecastMax = Math.max(...forecast.days.map((d) => d.count), 1);
  const month = useMemo(() => buildForecast(collections, 30), [collections]);

  const streakWeek = useMemo(() => weekProgress(stats), [stats]);
  const slots = useMemo(() => hourSlots(stats), [stats]);
  const slotMax = Math.max(...slots.map((s) => s.total), 1);
  const reviewsLogged = slots.reduce((a, s) => a + s.total, 0);
  const golden = useMemo(() => bestHour(stats), [stats]);

  const level = useMemo(() => levelInfo(xpOf(stats)), [stats]);
  const [period, setPeriod] = useState<Period>("week");
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => buildReport(stats, collections, period, goal), [stats, collections, period, goal]);
  const change = changePct(report);

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>
            Cấp {level.level} • {level.title}
          </h3>
          <MutedText>{level.xp.toLocaleString("vi-VN")} XP</MutedText>
        </div>
        <div style={{ height: 12, borderRadius: 9999, background: "var(--bg-tertiary)", overflow: "hidden", margin: "10px 0 6px" }} role="progressbar" aria-valuenow={level.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ lên cấp">
          <div style={{ width: `${level.pct}%`, height: "100%", background: "var(--accent-gradient, linear-gradient(135deg,#3b82f6,#8b5cf6))" }} />
        </div>
        <MutedText>
          Còn {(level.needed - level.into).toLocaleString("vi-VN")} XP để lên cấp {level.level + 1}. XP đến từ mỗi lượt ôn (2 XP), mỗi ngày học (10 XP) và xu kiếm được từ trò chơi.
        </MutedText>
      </Panel>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Tổng kết {PERIOD_LABEL[period]}</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {(["week", "month"] as Period[]).map((p) => (
              <MyButton key={p} size="sm" variant={period === p ? "primary" : "secondary"} onClick={() => { setPeriod(p); setCopied(false); }}>
                {p === "week" ? "Tuần" : "Tháng"}
              </MyButton>
            ))}
          </div>
        </div>
        <Cols>
          <div className="box">
            <span className="value">{report.reviews}</span>
            <span className="label">Lượt ôn{change === null ? "" : ` (${change >= 0 ? "+" : ""}${change}%)`}</span>
          </div>
          <div className="box">
            <span className="value">
              {report.daysStudied}/{PERIOD_DAYS[period]}
            </span>
            <span className="label">Ngày có học</span>
          </div>
          <div className="box">
            <span className="value">{report.goalDays}</span>
            <span className="label">Ngày đạt mục tiêu</span>
          </div>
          <div className="box">
            <span className="value">{report.cardsTouched}</span>
            <span className="label">Thẻ đã ôn ({report.masteredTouched} đã thuộc)</span>
          </div>
        </Cols>
        <MutedText style={{ marginTop: 10 }}>
          {report.bestDay ? `Ngày chăm nhất: ${Number(report.bestDay.day.slice(8))}/${Number(report.bestDay.day.slice(5, 7))} với ${report.bestDay.count} lượt. ` : "Chưa có lượt ôn nào trong kỳ này. "}
          {report.averagePerStudyDay > 0 ? `Trung bình ${report.averagePerStudyDay} lượt mỗi ngày học. ` : ""}
          {report.busiestHour !== null ? `Bạn hay học nhất lúc ${report.busiestHour}h. ` : ""}
          {report.hardWords.length > 0 ? `Từ khó nhất: ${report.hardWords.map((w) => `${w.source} (sai ${w.wrong} lần)`).join(", ")}.` : ""}
        </MutedText>
        <div style={{ marginTop: 10 }}>
          <MyButton
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(reportText(report));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Đã sao chép!" : "Sao chép bản tổng kết"}
          </MyButton>
        </div>
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
        <h3>Dự báo ôn tập 14 ngày tới</h3>
        {forecast.total === 0 ? (
          <MutedText>Chưa có thẻ nào đã lên lịch ôn. Hãy ôn vài thẻ để hệ thống tính ngày nhắc lại.</MutedText>
        ) : (
          <>
            <svg viewBox="0 0 350 140" width="100%" role="img" aria-label="Biểu đồ số thẻ đến hạn trong 14 ngày tới">
              {forecast.days.map((d, i) => {
                const h = (d.count / forecastMax) * 90;
                const x = i * 25 + 3;
                return (
                  <g key={d.key}>
                    <rect x={x} y={110 - h} width="19" height={Math.max(h, 1)} rx="3" fill={i === 0 ? "#ef4444" : "#8b5cf6"}>
                      <title>{`${d.key}: ${d.count} thẻ đến hạn`}</title>
                    </rect>
                    {d.count > 0 && (
                      <text x={x + 9.5} y={104 - h} textAnchor="middle" fontSize="9" fill="currentColor">
                        {d.count}
                      </text>
                    )}
                    <text x={x + 9.5} y="126" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">
                      {i === 0 ? "Nay" : d.date.getDate()}
                    </text>
                  </g>
                );
              })}
            </svg>
            <MutedText style={{ marginTop: 8 }}>
              Hôm nay {forecast.days[0].count} thẻ{forecast.overdue > 0 ? ` (gồm ${forecast.overdue} thẻ quá hạn)` : ""} • 7 ngày tới{" "}
              {forecast.days.slice(0, 7).reduce((a, d) => a + d.count, 0)} thẻ • 30 ngày tới {month.total} thẻ
              {forecast.peak && forecast.peak.key !== forecast.days[0].key
                ? ` • đông nhất ngày ${forecast.peak.date.getDate()}/${forecast.peak.date.getMonth() + 1} (${forecast.peak.count} thẻ)`
                : ""}
            </MutedText>
          </>
        )}
      </Panel>

      <Panel>
        <h3>Chuỗi ngày và băng streak</h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {streakWeek.days.map((d, i) => (
            <div
              key={d.key}
              title={d.frozen ? `${d.key}: được băng streak bảo vệ` : d.done ? `${d.key}: đã học` : d.key}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px 0",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                background: d.frozen ? "rgba(59,130,246,0.18)" : d.done ? "rgba(16,185,129,0.18)" : "var(--bg-tertiary, #f1f5f9)",
                border: d.key === daysAgoKey(0) ? "2px solid #3b82f6" : "2px solid transparent"
              }}
            >
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}
              <div style={{ fontSize: 15 }}>{d.frozen ? "🧊" : d.done ? "✓" : "·"}</div>
            </div>
          ))}
        </div>
        <MutedText>
          Tuần này: {streakWeek.studied}/7 ngày (mục tiêu 5 ngày{streakWeek.studied >= 5 ? " — đã đạt 🎉" : ""}). Bạn có <strong>{stats.freezes ?? 0}</strong>{" "}
          băng streak 🧊 (tối đa {MAX_FREEZES}, mỗi tháng nhận thêm 2). Nếu bỏ lỡ 1–2 ngày, băng streak tự động giữ chuỗi cho bạn khi quay lại học.
        </MutedText>
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
        <h3>Giờ vàng ghi nhớ</h3>
        {reviewsLogged === 0 ? (
          <MutedText>Chưa đủ dữ liệu. Sau khi ôn tập vài buổi, MemCard sẽ chỉ ra khung giờ bạn nhớ tốt nhất.</MutedText>
        ) : (
          <>
            <svg viewBox="0 0 360 100" width="100%" role="img" aria-label="Số lượt ôn và độ chính xác theo giờ trong ngày">
              {slots.map((s) => {
                const h = (s.total / slotMax) * 60;
                const x = s.hour * 15 + 1;
                const isBest = golden?.hour === s.hour;
                return (
                  <g key={s.hour}>
                    <rect x={x} y={70 - h} width="12" height={Math.max(h, 1)} rx="2" fill={isBest ? "#f59e0b" : "#3b82f6"} opacity={s.total ? 1 : 0.2}>
                      <title>{`${s.hour}h: ${s.total} lượt, đúng ${s.total ? Math.round(s.accuracy * 100) : 0}%`}</title>
                    </rect>
                    {s.hour % 3 === 0 && (
                      <text x={x + 6} y="86" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">
                        {s.hour}h
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {golden ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <MutedText>
                  Bạn nhớ tốt nhất lúc <strong>{golden.hour}h</strong> (đúng {Math.round(golden.accuracy * 100)}% trong {golden.total} lượt).
                </MutedText>
                {settings.reminderTime !== hourToTime(golden.hour) && (
                  <MyButton
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ reminderTime: hourToTime(golden.hour), reminderEnabled: true })}
                  >
                    Nhắc học lúc {hourToTime(golden.hour)}
                  </MyButton>
                )}
              </div>
            ) : (
              <MutedText>
                Cần ít nhất {MIN_REVIEWS_FOR_ADVICE} lượt ôn (hiện có {reviewsLogged}) để gợi ý giờ vàng.
              </MutedText>
            )}
          </>
        )}
      </Panel>

      <Panel>
        <h3>
          Huy hiệu ({badges.filter((b) => b.earned).length}/{badges.length})
        </h3>
        <BadgeGrid>
          {badges.map((b) =>
            b.hidden && !b.earned ? (
              <BadgeCard key={b.id} $earned={false} title="Huy hiệu bí mật">
                <span className="icon">❓</span>
                <span className="title">???</span>
                <span className="desc">Huy hiệu bí mật — hãy khám phá!</span>
              </BadgeCard>
            ) : (
              <BadgeCard key={b.id} $earned={b.earned} title={b.description}>
                <span className="icon">{b.icon}</span>
                <span className="title">{b.title}</span>
                <span className="desc">{b.earned ? b.description : `${b.description} (${b.progress})`}</span>
              </BadgeCard>
            )
          )}
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
