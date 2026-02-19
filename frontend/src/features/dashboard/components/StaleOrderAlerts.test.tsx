import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaleOrderAlerts } from "./StaleOrderAlerts";

describe("StaleOrderAlerts", () => {
  it("given alerts, when rendered, then shows alert details", () => {
    const alerts = [
      {
        repairOrderId: 1,
        title: "Cambio de aceite",
        clientFullName: "Juan Perez",
        vehiclePlate: "ABC123",
        status: "REPARACION",
        daysSinceLastUpdate: 10,
      },
    ];

    render(<StaleOrderAlerts alerts={alerts} thresholdDays={5} />);

    expect(screen.getByText(/Cambio de aceite/)).toBeInTheDocument();
    expect(screen.getByText(/10 días sin actualización/)).toBeInTheDocument();
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(<StaleOrderAlerts alerts={[]} thresholdDays={5} />);

    expect(screen.getByText("No hay órdenes inactivas")).toBeInTheDocument();
  });

  it("given threshold, when rendered, then shows threshold in title", () => {
    render(<StaleOrderAlerts alerts={[]} thresholdDays={7} />);

    expect(screen.getByText(/\+7 días/)).toBeInTheDocument();
  });
});
