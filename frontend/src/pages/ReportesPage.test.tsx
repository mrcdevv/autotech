import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import ReportesPage from "./ReportesPage";

vi.mock("@/features/dashboard/components/FinancieroTab", () => ({
  FinancieroTab: () => <div data-testid="financiero-tab">FinancieroTab</div>,
}));

vi.mock("@/features/dashboard/components/ProductividadTab", () => ({
  ProductividadTab: () => <div data-testid="productividad-tab">ProductividadTab</div>,
}));

describe("ReportesPage", () => {
  it("given page loaded, when rendered, then shows title and Financiero tab by default", () => {
    render(<ReportesPage />);

    expect(screen.getByText("Reportes")).toBeInTheDocument();
    expect(screen.getByTestId("financiero-tab")).toBeInTheDocument();
  });

  it("given page loaded, when clicking Productividad tab, then shows productividad content", async () => {
    const user = userEvent.setup();
    render(<ReportesPage />);

    await user.click(screen.getByRole("tab", { name: "Productividad" }));

    expect(screen.getByTestId("productividad-tab")).toBeInTheDocument();
  });
});
