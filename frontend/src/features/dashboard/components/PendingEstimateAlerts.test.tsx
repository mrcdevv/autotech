import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PendingEstimateAlerts } from "./PendingEstimateAlerts";

describe("PendingEstimateAlerts", () => {
  it("given alerts, when rendered, then shows estimate details", () => {
    const alerts = [
      {
        estimateId: 1,
        clientFullName: "Maria Garcia",
        vehiclePlate: "XYZ789",
        total: 25000,
        daysPending: 7,
      },
    ];

    render(<PendingEstimateAlerts alerts={alerts} thresholdDays={5} />);

    expect(screen.getByText(/Maria Garcia/)).toBeInTheDocument();
    expect(screen.getByText(/7 días pendiente/)).toBeInTheDocument();
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(<PendingEstimateAlerts alerts={[]} thresholdDays={5} />);

    expect(screen.getByText("No hay presupuestos pendientes")).toBeInTheDocument();
  });
});
