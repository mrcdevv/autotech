import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { InspectionsTab } from "./InspectionsTab";
import { useRepairOrderInspections } from "@/features/inspections/useRepairOrderInspections";

import type { InspectionResponse } from "./types";

vi.mock("@/features/inspections/useRepairOrderInspections", () => ({
  useRepairOrderInspections: vi.fn(),
}));

vi.mock("@/features/inspections/useInspectionTemplates", () => ({
  useInspectionTemplates: vi.fn().mockReturnValue({ templates: [], loading: false, refetch: vi.fn() }),
}));

vi.mock("./InspectionForm", () => ({
  InspectionForm: ({ inspection }: { inspection: InspectionResponse }) => (
    <div data-testid={`inspection-form-${inspection.id}`} />
  ),
}));

function mockInspections(inspections: InspectionResponse[]): void {
  vi.mocked(useRepairOrderInspections).mockReturnValue({
    inspections,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
}

const inspection = (id: number): InspectionResponse => ({
  id,
  repairOrderId: 42,
  templateId: 1,
  templateTitle: "Inspección general",
  groups: [],
  createdAt: "2025-03-01T10:00:00",
  updatedAt: "2025-03-01T10:00:00",
});

const baseProps = {
  repairOrderId: 42,
  reason: null,
  mechanicNotes: null,
  onRepairOrderUpdated: vi.fn(),
  clientFirstName: "Juan",
  clientLastName: "Perez",
  clientDni: null,
  vehiclePlate: "ABC123",
  vehicleBrandName: null,
  vehicleModel: null,
  vehicleYear: null,
};

describe("InspectionsTab (empty state)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("given no inspections, when rendered, then the empty state is a titled, described block with the add action inside it", () => {
    mockInspections([]);

    render(<InspectionsTab {...baseProps} />);

    const title = screen.getByText("Aún no hay inspecciones");
    expect(
      screen.getByText("Registrá qué está bien, qué hay que arreglar y qué puede esperar."),
    ).toBeInTheDocument();

    // The action must live INSIDE the same bordered container as the title, not in a
    // separate toolbar above it.
    const container = title.closest(".MuiPaper-root");
    expect(container).not.toBeNull();
    expect(container!.contains(screen.getByRole("button", { name: "Agregar inspección" }))).toBe(
      true,
    );
  });

  it("given no inspections, when rendered, then the toolbar with its duplicate add button and print action is not shown", () => {
    mockInspections([]);

    render(<InspectionsTab {...baseProps} />);

    expect(screen.getAllByRole("button", { name: "Agregar inspección" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /imprimir resumen/i })).not.toBeInTheDocument();
  });

  it("given at least one inspection, when rendered, then the toolbar keeps both actions and no empty state is shown", () => {
    mockInspections([inspection(1)]);

    render(<InspectionsTab {...baseProps} />);

    expect(screen.getByRole("button", { name: /imprimir resumen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar inspección" })).toBeEnabled();
    expect(screen.getByTestId("inspection-form-1")).toBeInTheDocument();
    expect(screen.queryByText("Aún no hay inspecciones")).not.toBeInTheDocument();
  });
});
