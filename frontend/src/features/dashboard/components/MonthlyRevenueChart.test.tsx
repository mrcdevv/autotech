import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { MonthlyRevenueChart } from "./MonthlyRevenueChart";

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: ({ xAxis, series }: { xAxis: [{ data: string[] }]; series: [{ data: number[] }] }) => (
    <div data-testid="bar-chart">
      {xAxis[0].data.join(",")}
      {series[0].data.join(",")}
    </div>
  ),
}));

describe("MonthlyRevenueChart", () => {
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
