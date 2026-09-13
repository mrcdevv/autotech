import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { ProductividadTab } from "./ProductividadTab";

vi.mock("@/features/dashboard/hooks/useProductividad", () => ({
  useProductividad: () => ({
    data: {
      averageRepairDays: 3.5,
      mechanicProductivity: [
        { employeeId: 1, employeeFullName: "Juan Perez", completedOrders: 5 },
      ],
      topServices: [
        { serviceName: "Cambio de aceite", count: 10 },
      ],
    },
    loading: false,
    error: null,
    exportToExcel: vi.fn(),
  }),
}));

describe("ProductividadTab", () => {
  it("given data loaded, when rendered, then shows avg repair time and export button", () => {
    render(<ProductividadTab />);

    expect(screen.getByText("3.5 días")).toBeInTheDocument();
    expect(screen.getByText("Exportar a Excel")).toBeInTheDocument();
  });

  it("given data loaded, when rendered, then shows mechanic and services tables", () => {
    render(<ProductividadTab />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
  });
});
