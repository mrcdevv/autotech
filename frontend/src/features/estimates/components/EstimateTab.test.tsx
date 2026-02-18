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
    render(<EstimateTab repairOrderId={42} />);

    expect(screen.getByTestId("estimate-detail")).toBeInTheDocument();
    expect(screen.getByText("EstimateDetail for RO #42")).toBeInTheDocument();
  });
});
