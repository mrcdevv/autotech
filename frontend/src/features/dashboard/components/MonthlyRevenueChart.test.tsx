import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MonthlyRevenueChart } from "./MonthlyRevenueChart";

// The real BarChart renders ticks with canvas/svg internals that jsdom cannot lay out,
// so this stub replaces it. It must NOT discard the formatter props: it captures them so
// the tests can exercise the series and yAxis formatters directly (decision D2).
interface MockSeries {
  data: number[];
  label?: string;
  valueFormatter?: (value: number | null | undefined) => string;
}

interface MockYAxis {
  valueFormatter?: (value: number | null | undefined) => string;
}

export interface MockBarChartProps {
  xAxis: [{ data: string[] }];
  yAxis?: MockYAxis[];
  series: MockSeries[];
}

const chartPropsHolder = vi.hoisted(() => ({ current: [] as MockBarChartProps[] }));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: (props: MockBarChartProps) => {
    chartPropsHolder.current.push(props);
    const xAxisData = props.xAxis[0]?.data ?? [];
    const seriesData = props.series[0]?.data ?? [];
    return (
      <div data-testid="bar-chart">
        {xAxisData.join(",")}
        {seriesData.join(",")}
      </div>
    );
  },
}));

function lastChartProps(): MockBarChartProps {
  const props = chartPropsHolder.current.at(-1);
  if (!props) {
    throw new Error("BarChart was never rendered");
  }
  return props;
}

describe("MonthlyRevenueChart", () => {
  beforeEach(() => {
    chartPropsHolder.current = [];
  });

  it("given data, when rendered, then shows chart and toggle", () => {
    const data = [{ year: 2026, month: 1, total: 50000 }];

    render(<MonthlyRevenueChart data={data} months={6} onMonthsChange={vi.fn()} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByText("6 meses")).toBeInTheDocument();
    expect(screen.getByText("12 meses")).toBeInTheDocument();
  });

  it("given toggle clicked, when 12 months selected, then calls onMonthsChange", async () => {
    const onMonthsChange = vi.fn();
    const user = userEvent.setup();
    const data = [{ year: 2026, month: 1, total: 50000 }];

    render(<MonthlyRevenueChart data={data} months={6} onMonthsChange={onMonthsChange} />);

    await user.click(screen.getByText("12 meses"));

    expect(onMonthsChange).toHaveBeenCalledWith(12);
  });

  it("given empty data, when rendered, then keeps every selected month with zero values", () => {
    render(<MonthlyRevenueChart data={[]} months={6} onMonthsChange={vi.fn()} />);

    expect(screen.getByTestId("bar-chart")).toHaveTextContent("0,0,0,0,0,0");
  });
});

// Literal expectations (not derived from formatCurrencyWhole) so a helper regression is
// caught instead of silently re-asserted. es-AR emits a NON-BREAKING SPACE (U+00A0) after
// the "$" symbol and uses "." for thousands grouping.
describe("MonthlyRevenueChart formatters (decision D2)", () => {
  beforeEach(() => {
    chartPropsHolder.current = [];
  });

  it("given a chart, when rendered, then the series formatter renders whole-number es-AR currency and empty for null and undefined", () => {
    render(<MonthlyRevenueChart data={[]} months={6} onMonthsChange={vi.fn()} />);

    const { series } = lastChartProps();
    const formatter = series[0]?.valueFormatter;
    expect(formatter).toBeDefined();
    // Whole number: "$" + U+00A0, "." thousands separator, no decimals. 1234567.89
    // rounds UP under ECMA-402 half-expand to 1.234.568.
    expect(formatter!(1234567.89)).toMatch(/^\$\u00A01\.234\.568$/);
    expect(formatter!(950)).toMatch(/^\$\u00A0950$/);
    expect(formatter!(null)).toBe("");
    expect(formatter!(undefined)).toBe("");
  });

  it("given a chart, when rendered, then the yAxis tick formatter renders whole-number es-AR currency and empty for null and undefined", () => {
    render(<MonthlyRevenueChart data={[]} months={6} onMonthsChange={vi.fn()} />);

    const { yAxis } = lastChartProps();
    const formatter = yAxis?.[0]?.valueFormatter;
    expect(formatter).toBeDefined();
    expect(formatter!(1234567.89)).toMatch(/^\$\u00A01\.234\.568$/);
    expect(formatter!(950)).toMatch(/^\$\u00A0950$/);
    expect(formatter!(null)).toBe("");
    expect(formatter!(undefined)).toBe("");
  });
});
