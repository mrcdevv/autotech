import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ServiceRevenueChart } from "./ServiceRevenueChart";

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

interface MockBarChartProps {
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

// Literal expectations (not derived from formatCurrencyWhole) so a helper regression is
// caught instead of silently re-asserted. es-AR emits a NON-BREAKING SPACE (U+00A0) after
// the "$" symbol and uses "." for thousands grouping.
describe("ServiceRevenueChart formatters (decision D2)", () => {
  beforeEach(() => {
    chartPropsHolder.current = [];
  });

  it("given a chart, when rendered, then the series formatter renders whole-number es-AR currency and empty for null and undefined", () => {
    render(
      <ServiceRevenueChart
        data={[{ serviceName: "Cambio de aceite", totalRevenue: 1234567.89 }]}
      />,
    );

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
    render(
      <ServiceRevenueChart
        data={[{ serviceName: "Cambio de aceite", totalRevenue: 1234567.89 }]}
      />,
    );

    const { yAxis } = lastChartProps();
    const formatter = yAxis?.[0]?.valueFormatter;
    expect(formatter).toBeDefined();
    expect(formatter!(1234567.89)).toMatch(/^\$\u00A01\.234\.568$/);
    expect(formatter!(950)).toMatch(/^\$\u00A0950$/);
    expect(formatter!(null)).toBe("");
    expect(formatter!(undefined)).toBe("");
  });

  it("given service data, when rendered, then keeps the existing yAxis tick properties alongside the formatter", () => {
    render(
      <ServiceRevenueChart
        data={[{ serviceName: "Cambio de aceite", totalRevenue: 1234567.89 }]}
      />,
    );

    const { yAxis } = lastChartProps();
    expect(yAxis?.[0]).toMatchObject({
      disableLine: true,
      disableTicks: true,
      tickLabelStyle: { fill: "#8A909B", fontSize: 11 },
    });
  });
});
