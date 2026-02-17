import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBreakdownCard } from "./StatusBreakdownCard";

describe("StatusBreakdownCard", () => {
  it("given status counts, when rendered, then shows labels with counts", () => {
    const statusCounts = [
      { status: "REPARACION", count: 3 },
      { status: "ENTREGADO", count: 2 },
    ];

    render(<StatusBreakdownCard statusCounts={statusCounts} />);

    expect(screen.getByText("Reparación: 3")).toBeInTheDocument();
    expect(screen.getByText("Entregado: 2")).toBeInTheDocument();
  });

  it("given empty counts, when rendered, then shows empty state", () => {
    render(<StatusBreakdownCard statusCounts={[]} />);

    expect(screen.getByText("Sin órdenes registradas")).toBeInTheDocument();
  });

  it("given unknown status, when rendered, then shows raw status name", () => {
    render(<StatusBreakdownCard statusCounts={[{ status: "UNKNOWN", count: 1 }]} />);

    expect(screen.getByText("UNKNOWN: 1")).toBeInTheDocument();
  });
});
