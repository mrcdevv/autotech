import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { EstimateTab } from "./EstimateTab";

vi.mock("./EstimateDetail", () => ({
  EstimateDetail: (props: Record<string, unknown>) => (
    <div data-testid="estimate-detail" data-props={JSON.stringify(props)}>
      EstimateDetail
    </div>
  ),
}));

describe("EstimateTab", () => {
  it("given repairOrderId, when rendered, then passes it to EstimateDetail", () => {
    render(
      <EstimateTab
        repairOrderId={42}
        clientId={1}
        clientFirstName="Juan"
        clientLastName="Perez"
        clientDni="12345678"
        vehicleId={10}
        vehiclePlate="ABC123"
        vehicleBrandName="Ford"
        vehicleModel="Focus"
        vehicleYear={2020}
        reason={null}
        mechanicNotes={null}
      />,
    );

    expect(screen.getByTestId("estimate-detail")).toBeInTheDocument();
    expect(screen.getByText("EstimateDetail")).toBeInTheDocument();
  });

  it("given a repair order status, when rendered, then passes it to EstimateDetail", () => {
    render(
      <EstimateTab
        repairOrderId={42}
        clientId={1}
        clientFirstName="Juan"
        clientLastName="Perez"
        clientDni="12345678"
        vehicleId={10}
        vehiclePlate="ABC123"
        vehicleBrandName="Ford"
        vehicleModel="Focus"
        vehicleYear={2020}
        reason={null}
        mechanicNotes={null}
        repairOrderStatus="ENTREGADO"
      />,
    );

    const props = JSON.parse(
      screen.getByTestId("estimate-detail").getAttribute("data-props") ?? "{}",
    ) as Record<string, unknown>;
    expect(props.repairOrderStatus).toBe("ENTREGADO");
  });
});
