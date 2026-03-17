import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopServicesTable } from "./TopServicesTable";

describe("TopServicesTable", () => {
  it("given data, when rendered, then shows service names and counts", () => {
    const data = [
      { serviceName: "Cambio de aceite", count: 10 },
      { serviceName: "Alineación", count: 7 },
    ];

    render(<TopServicesTable data={data} />);

    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Alineación")).toBeInTheDocument();
  });

  it("given empty data, when rendered, then shows empty state", () => {
    render(<TopServicesTable data={[]} />);

    expect(screen.getByText("Sin datos este mes")).toBeInTheDocument();
  });
});
