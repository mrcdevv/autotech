import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { InspectionTemplatesTab } from "./InspectionTemplatesTab";

import type { InspectionTemplateResponse } from "@/features/inspections/types";

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockTemplates: InspectionTemplateResponse[] = [
  {
    id: 1,
    title: "Inspección General",
    groups: [{ id: 1, title: "Motor", sortOrder: 0, items: [] }],
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  },
];

const mockRefetch = vi.fn();
const mockDuplicate = vi.fn();
const mockDeleteTemplate = vi.fn();

vi.mock("@/features/inspections/useInspectionTemplates", () => ({
  useInspectionTemplates: () => ({
    templates: mockTemplates,
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@/api/inspections", () => ({
  inspectionTemplatesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: (...args: unknown[]) => mockDeleteTemplate(...args),
    duplicate: (...args: unknown[]) => mockDuplicate(...args),
  },
}));

describe("InspectionTemplatesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDuplicate.mockResolvedValue({ data: { data: {} } });
    mockDeleteTemplate.mockResolvedValue({ data: { data: null } });
  });

  it("given templates exist, when rendered, then shows template cards", () => {
    render(<InspectionTemplatesTab />);

    expect(screen.getByText("Inspección General")).toBeInTheDocument();
    expect(screen.getByText("1 grupo(s)")).toBeInTheDocument();
  });

  it("given new button, when clicked, then navigates to template builder", async () => {
    const user = userEvent.setup();
    render(<InspectionTemplatesTab />);

    await user.click(screen.getByText("Nueva plantilla"));

    expect(mockNavigate).toHaveBeenCalledWith("/configuracion/plantillas-inspeccion/nueva");
  });

  it("given duplicate button, when clicked, then calls duplicate API", async () => {
    const user = userEvent.setup();
    render(<InspectionTemplatesTab />);

    const duplicateBtn = screen.getByTestId("ContentCopyIcon");
    await user.click(duplicateBtn);

    await waitFor(() => {
      expect(mockDuplicate).toHaveBeenCalledWith(1);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("given delete button, when clicked, then calls delete API", async () => {
    const user = userEvent.setup();
    render(<InspectionTemplatesTab />);

    const deleteBtn = screen.getByTestId("DeleteIcon");
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith(1);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
