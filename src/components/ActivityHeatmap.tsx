import React, { useMemo } from "react";
import styled from "styled-components";
import { daysAgoKey, dateKey, dayOfWeek } from "utils/dates";

const CELL = 13;
const GAP = 3;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Caption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 12px;
  font-size: 12.5px;
  color: var(--text-secondary, #64748b);

  strong {
    color: var(--text-primary, #0f172a);
    font-weight: 700;
  }
`;

const Scroll = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const Months = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, ${CELL}px);
  column-gap: ${GAP}px;
  height: 16px;
  width: max-content;
  font-size: 10.5px;
  line-height: 16px;
  color: var(--text-muted, #94a3b8);

  span {
    white-space: nowrap;
  }
`;

const WeekdayLabels = styled.div`
  display: grid;
  grid-template-rows: repeat(7, ${CELL}px);
  row-gap: ${GAP}px;
  margin-top: 19px; /* aligns with the grid below the month row */
  font-size: 10px;
  line-height: ${CELL}px;
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, ${CELL}px);
  grid-auto-columns: ${CELL}px;
  gap: ${GAP}px;
  width: max-content;
`;

const Cell = styled.div<{ $level: number; $today?: boolean }>`
  width: ${CELL}px;
  height: ${CELL}px;
  border-radius: 3px;
  box-sizing: border-box;
  outline: ${(p) => (p.$today ? "2px solid #f59e0b" : "none")};
  outline-offset: 1px;
  background-color: ${(p) =>
    [
      "var(--bg-tertiary, #e2e8f0)",
      "rgba(59, 130, 246, 0.30)",
      "rgba(59, 130, 246, 0.55)",
      "rgba(37, 99, 235, 0.80)",
      "#1d4ed8"
    ][p.$level]};
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);

  .today {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
`;

const levelFor = (count: number, goal: number) => {
  if (count <= 0) return 0;
  const ratio = count / Math.max(goal, 1);
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
};

const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

/** "2026-10-08" -> "08/10/2026" */
export const formatDay = (key: string): string => {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
};

const monthOf = (key: string) => Number(key.split("-")[1]);

interface Props {
  log?: Record<string, number>;
  goal: number;
  weeks?: number;
}

export default function ActivityHeatmap({ log = {}, goal, weeks = 18 }: Props) {
  const { cells, columns, monthLabels, from, to, total, activeDays } = useMemo(() => {
    // Columns are weeks starting on Sunday, so the first cell must land on a Sunday
    const todayDow = new Date().getDay();
    const list: { key: string; count: number }[] = [];
    for (let offset = todayDow + 7 * (weeks - 1); offset >= 0; offset--) {
      const key = daysAgoKey(offset);
      list.push({ key, count: log[key] || 0 });
    }

    // A month label sits above the first column in which that month starts
    const labels: { col: number; text: string }[] = [];
    let prev = -1;
    for (let c = 0; c * 7 < list.length; c++) {
      const month = monthOf(list[c * 7].key);
      if (month !== prev) {
        labels.push({ col: c, text: `Th${month}` });
        prev = month;
      }
    }
    // The first label would collide with the next one when the first month only has a sliver
    if (labels.length > 1 && labels[1].col - labels[0].col < 3) labels.shift();

    return {
      cells: list,
      columns: Math.ceil(list.length / 7),
      monthLabels: labels,
      from: list[0].key,
      to: list[list.length - 1].key,
      total: list.reduce((a, c) => a + c.count, 0),
      activeDays: list.filter((c) => c.count > 0).length
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, weeks]);

  const today = dateKey();

  return (
    <Wrap>
      <Caption>
        <span>
          {weeks} tuần gần đây: <strong>{formatDay(from)}</strong> – <strong>{formatDay(to)}</strong>
        </span>
        <span>
          <strong>{total}</strong> lượt ôn • <strong>{activeDays}</strong> ngày có học
        </span>
      </Caption>

      <Scroll>
        <WeekdayLabels aria-hidden="true">
          {["", "T2", "", "T4", "", "T6", ""].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </WeekdayLabels>
        <div>
          <Months $cols={columns} aria-hidden="true">
            {monthLabels.map((m) => (
              <span key={m.col} style={{ gridColumn: `${m.col + 1} / span 3` }}>
                {m.text}
              </span>
            ))}
          </Months>
          <Grid role="img" aria-label={`Hoạt động ôn tập từ ${formatDay(from)} đến ${formatDay(to)}`}>
            {cells.map((c) => (
              <Cell
                key={c.key}
                $level={levelFor(c.count, goal)}
                $today={c.key === today}
                aria-current={c.key === today ? "date" : undefined}
                title={`${WEEKDAYS[dayOfWeek(c.key)]}, ${formatDay(c.key)}: ${c.count > 0 ? `${c.count} lượt ôn` : "chưa ôn"}${c.key === today ? " (hôm nay)" : ""}`}
              />
            ))}
          </Grid>
        </div>
      </Scroll>

      <Legend>
        Ít
        {[0, 1, 2, 3, 4].map((l) => (
          <Cell key={l} $level={l} />
        ))}
        Nhiều
        <span className="today">
          <Cell $level={0} $today /> Hôm nay
        </span>
      </Legend>
    </Wrap>
  );
}
