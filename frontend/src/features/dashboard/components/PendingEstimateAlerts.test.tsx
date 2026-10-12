import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, it, expect } from "vitest";
import { PendingEstimateAlerts } from "./PendingEstimateAlerts";

function LocationProbe({ onLocation }: { onLocation: (pathname: string) => void }) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

describe("PendingEstimateAlerts", () => {
  const alerts = [
    {
      estimateId: 1,
      clientFullName: "Maria Garcia",
      vehiclePlate: "XYZ789",
      total: 25000,
      daysPending: 7,
    },
    {
      estimateId: 2,
      clientFullName: "Maria Garcia",
      vehiclePlate: "LMN456",
      total: 25000,
      daysPending: 7,
    },
  ];

  it("given alerts, when rendered, then shows estimate details", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={alerts.slice(0, 1)} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Maria Garcia/)).toBeInTheDocument();
    expect(screen.getByText("7 días")).toBeInTheDocument();
  });

  it("given alerts, when rendered, then each row is a link to its estimate", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={[...alerts]} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /presupuesto #1/i })).toHaveAttribute(
      "href",
      "/presupuestos/1",
    );
    expect(screen.getByRole("link", { name: /presupuesto #2/i })).toHaveAttribute(
      "href",
      "/presupuestos/2",
    );
  });

  it("given alerts, when a row is clicked, then it navigates to the referenced estimate", async () => {
    let pathname = "";
    const onLocation = (value: string) => {
      pathname = value;
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationProbe onLocation={onLocation} />
        <PendingEstimateAlerts alerts={alerts} thresholdDays={5} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: /presupuesto #1/i }));

    expect(pathname).toBe("/presupuestos/1");
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(
      <MemoryRouter>
        <PendingEstimateAlerts alerts={[]} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No hay presupuestos pendientes")).toBeInTheDocument();
  });
});
