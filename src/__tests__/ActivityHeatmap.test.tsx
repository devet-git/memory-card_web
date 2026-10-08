import React from "react";
import { render, screen } from "@testing-library/react";
import ActivityHeatmap, { formatDay } from "components/ActivityHeatmap";

// Thursday 8 Oct 2026
const TODAY = new Date(2026, 9, 8, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TODAY);
});
afterEach(() => jest.useRealTimers());

describe("ActivityHeatmap", () => {
  test("states the period it covers, so the grid can be read as dates", () => {
    render(<ActivityHeatmap goal={20} weeks={16} />);
    // 16 week-columns that start on Sunday and end today: 21/06/2026 (Sunday) .. 08/10/2026
    expect(screen.getByText(/16 tuần gần đây/)).toBeInTheDocument();
    expect(screen.getByText("21/06/2026")).toBeInTheDocument();
    expect(screen.getByText("08/10/2026")).toBeInTheDocument();
  });

  test("totals the reviews and active days inside the period", () => {
    render(<ActivityHeatmap goal={20} weeks={16} log={{ "2026-10-08": 5, "2026-10-07": 12, "2026-01-01": 99 /* outside */ }} />);
    expect(screen.getByText("17")).toBeInTheDocument(); // reviews
    expect(screen.getByText("2")).toBeInTheDocument(); // days
  });

  test("every cell has a tooltip with weekday, date and count", () => {
    const { container } = render(<ActivityHeatmap goal={20} weeks={16} log={{ "2026-10-07": 12 }} />);
    expect(container.querySelector('[title="Thứ tư, 07/10/2026: 12 lượt ôn"]')).toBeTruthy();
    expect(container.querySelector('[title="Thứ năm, 08/10/2026: chưa ôn (hôm nay)"]')).toBeTruthy();
  });

  test("today is marked, once in the grid", () => {
    const { container } = render(<ActivityHeatmap goal={20} weeks={16} />);
    expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  });

  test("month labels run across the top in order; a sliver of a month at the left edge gets no label", () => {
    const { container } = render(<ActivityHeatmap goal={20} weeks={16} />);
    const labels = Array.from(container.querySelectorAll("span")).map((s) => s.textContent).filter((t) => /^Th\d+$/.test(t || ""));
    // the grid starts on 21/06, so June only owns two columns and would overlap "Th7"
    expect(labels).toEqual(["Th7", "Th8", "Th9", "Th10"]);
  });

  test("weekday labels are shown for Monday, Wednesday and Friday", () => {
    render(<ActivityHeatmap goal={20} weeks={4} />);
    ["T2", "T4", "T6"].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });

  test("formatDay turns a key into dd/mm/yyyy", () => {
    expect(formatDay("2026-01-05")).toBe("05/01/2026");
  });
});
