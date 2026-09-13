import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { RepairOrderSettingsTab } from "./RepairOrderSettingsTab";

describe("RepairOrderSettingsTab", () => {
  it("given tab, when rendered, then shows repair order settings placeholder", () => {
    render(<RepairOrderSettingsTab />);

    expect(screen.getByText("Órdenes de trabajo")).toBeInTheDocument();
    expect(
      screen.getByText("Todavía no hay configuraciones específicas para órdenes de trabajo."),
    ).toBeInTheDocument();
  });
});
