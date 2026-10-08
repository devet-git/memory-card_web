import React from "react";
import styled from "styled-components";
import { daysAgoKey } from "utils/dates";

const Wrap = styled.div`
  overflow-x: auto;
  padding-bottom: 4px;
`;

const Grid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 13px);
  grid-auto-columns: 13px;
  gap: 3px;
  width: max-content;
`;

const Cell = styled.div<{ $level: number }>`
  width: 13px;
  height: 13px;
  border-radius: 3px;
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
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
`;

const levelFor = (count: number, goal: number) => {
  if (count <= 0) return 0;
  const ratio = count / Math.max(goal, 1);
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
};

interface Props {
  log?: Record<string, number>;
  goal: number;
  weeks?: number;
}

export default function ActivityHeatmap({ log = {}, goal, weeks = 18 }: Props) {
  // Columns are weeks starting on Sunday, so the first cell must land on a Sunday
  const todayDow = new Date().getUTCDay();
  const cells: { key: string; count: number }[] = [];
  for (let offset = todayDow + 7 * (weeks - 1); offset >= 0; offset--) {
    const key = daysAgoKey(offset);
    cells.push({ key, count: log[key] || 0 });
  }

  return (
    <Wrap>
      <Grid>
        {cells.map((c) => (
          <Cell key={c.key} $level={levelFor(c.count, goal)} title={`${c.key}: ${c.count} thẻ`} />
        ))}
      </Grid>
      <Legend>
        Ít
        {[0, 1, 2, 3, 4].map((l) => (
          <Cell key={l} $level={l} />
        ))}
        Nhiều
      </Legend>
    </Wrap>
  );
}
