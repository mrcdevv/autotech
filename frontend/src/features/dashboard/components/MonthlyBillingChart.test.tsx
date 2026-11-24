import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { MonthlyBillingChart } from "./MonthlyBillingChart";

// The real BarChart needs layout that jsdom lacks; this stub captures its props so the
// tests can check the series and formatters (decision D2).
interface MockSeries {
  data: number[];
  label?: string;
  stack?: string;
  valueFormatter?: (value: number | null | undefined) => string;
}

interface MockBarChartProps {
  xAxis: [{ data: string[] }];
  yAxis?: { width?: number; valueFormatter?: (value: number | null | undefined) => string }[];
  series: MockSeries[];
}

const chartPropsHolder = vi.hoisted(() => ({ current: [] as MockBarChartProps[] }));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: (props: MockBarChartProps) => {
    chartPropsHolder.current.push(props);
    return <div data-testid="bar-chart" />;
  },
}));

function lastChartProps(): MockBarChartProps {
  const props = chartPropsHolder.current.at(-1);
  if (!props) throw new Error("BarChart was never rendered");
  return props;
}

describe("MonthlyBillingChart", () => {
  beforeEach(() => {
    chartPropsHolder.current = [];
  });

  it("given billed and collected months, when rendered, then stacks collected and pending per month", () => {
    render(
      <MonthlyBillingChart
        data={[{ year: 2026, month: 11, billed: 1000, collected: 400 }]}
        from="2026-10-01"
        to="2026-11-30"
      />
    );

    const { xAxis, series } = lastChartProps();
    expect(xAxis[0].data).toEqual(["Oct 2026", "Nov 2026"]);
    expect(series.map((s) => [s.label, s.stack, s.data])).toEqual([
      ["Cobrado", "billed", [0, 400]],
      ["Pendiente", "billed", [0, 600]],
    ]);
  });

  it("given a chart, when rendered, then the Y axis is wide enough and formats whole es-AR currency", () => {
    render(<MonthlyBillingChart data={[]} from="2026-11-01" to="2026-11-30" />);

    const axis = lastChartProps().yAxis?.[0];
    expect(axis?.width).toBe(80);
    // es-AR puts a non-breaking space after "$" and "." as thousands separator.
    expect(axis?.valueFormatter?.(400000)).toBe("$ 400.000");
    expect(axis?.valueFormatter?.(null)).toBe("");
  });
});
