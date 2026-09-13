import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MechanicProductivityTable } from "./MechanicProductivityTable";

describe("MechanicProductivityTable", () => {
  it("given data, when rendered, then shows mechanic names and counts", () => {
    const data = [
      { employeeId: 1, employeeFullName: "Juan Perez", completedOrders: 5 },
      { employeeId: 2, employeeFullName: "Maria Garcia", completedOrders: 3 },
    ];

    render(<MechanicProductivityTable data={data} />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("given empty data, when rendered, then shows empty state", () => {
    render(<MechanicProductivityTable data={[]} />);

    expect(screen.getByText("Sin datos este mes")).toBeInTheDocument();
  });
});
