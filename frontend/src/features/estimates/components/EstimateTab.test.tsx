import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { EstimateTab } from "./EstimateTab";

vi.mock("./EstimateDetail", () => ({
  EstimateDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="estimate-detail">EstimateDetail for RO #{repairOrderId}</div>
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
      />,
    );

    expect(screen.getByTestId("estimate-detail")).toBeInTheDocument();
    expect(screen.getByText("EstimateDetail for RO #42")).toBeInTheDocument();
  });
});
