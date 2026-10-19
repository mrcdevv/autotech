import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, it, expect } from "vitest";
import { StaleOrderAlerts } from "./StaleOrderAlerts";

function LocationProbe({ onLocation }: { onLocation: (pathname: string) => void }) {
  const location = useLocation();
  onLocation(location.pathname);
  return null;
}

describe("StaleOrderAlerts", () => {
  const alerts = [
    {
      repairOrderId: 1,
      title: "Cambio de aceite",
      clientFullName: "Juan Perez",
      vehiclePlate: "ABC123",
      status: "REPARACION",
      daysSinceLastUpdate: 10,
    },
    {
      repairOrderId: 2,
      title: "Cambio de aceite",
      clientFullName: "Juan Perez",
      vehiclePlate: "DEF456",
      status: "REPARACION",
      daysSinceLastUpdate: 10,
    },
  ];

  it("given alerts, when rendered, then shows alert details", () => {
    render(
      <MemoryRouter>
        <StaleOrderAlerts alerts={alerts.slice(0, 1)} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cambio de aceite/)).toBeInTheDocument();
    expect(screen.getByText("10 días")).toBeInTheDocument();
  });

  it("given alerts, when rendered, then each row is a link to its repair order", () => {
    render(
      <MemoryRouter>
        <StaleOrderAlerts alerts={[...alerts]} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /orden de trabajo #1/i })).toHaveAttribute(
      "href",
      "/ordenes-trabajo/1",
    );
    expect(screen.getByRole("link", { name: /orden de trabajo #2/i })).toHaveAttribute(
      "href",
      "/ordenes-trabajo/2",
    );
  });

  it("given alerts, when a row is clicked, then it navigates to the referenced order", async () => {
    let pathname = "";
    const onLocation = (value: string) => {
      pathname = value;
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationProbe onLocation={onLocation} />
        <StaleOrderAlerts alerts={alerts} thresholdDays={5} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: /orden de trabajo #1/i }));

    expect(pathname).toBe("/ordenes-trabajo/1");
  });

  it("given no alerts, when rendered, then shows empty state", () => {
    render(
      <MemoryRouter>
        <StaleOrderAlerts alerts={[]} thresholdDays={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No hay órdenes inactivas")).toBeInTheDocument();
  });

  it("given threshold, when rendered, then shows threshold in title", () => {
    render(
      <MemoryRouter>
        <StaleOrderAlerts alerts={[]} thresholdDays={7} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+7 días/)).toBeInTheDocument();
  });
});
