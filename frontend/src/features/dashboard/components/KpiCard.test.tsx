import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BuildIcon from "@mui/icons-material/Build";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("given title and numeric value, when rendered, then shows both", () => {
    render(<KpiCard title="Órdenes abiertas" value={5} icon={<BuildIcon />} />);

    expect(screen.getByText("Órdenes abiertas")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("given string value, when rendered, then shows value text", () => {
    render(<KpiCard title="Facturación" value="$ 50.000,00" icon={<BuildIcon />} />);

    expect(screen.getByText("$ 50.000,00")).toBeInTheDocument();
  });

  it("given title, when rendered, then shows icon", () => {
    render(<KpiCard title="Test" value={0} icon={<BuildIcon data-testid="test-icon" />} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});
