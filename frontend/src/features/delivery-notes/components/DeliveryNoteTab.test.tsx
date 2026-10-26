import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { DeliveryNoteTab } from "./DeliveryNoteTab";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import { estimatesApi } from "@/api/estimates";

vi.mock("./DeliveryNoteDetail", () => ({
  DeliveryNoteDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="deliveryNote-detail">DeliveryNoteDetail for RO #{repairOrderId}</div>
  ),
}));

// Probe the shared container instead of its MUI internals: the assertion is that the
// tab renders its empty title and description INSIDE the shared EmptyState.
vi.mock("@/components/EmptyState", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h6>{title}</h6>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: {
    getByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
  },
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getByRepairOrderId: vi.fn().mockRejectedValue(new Error("no estimate")),
    getAllByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

describe("DeliveryNoteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockResolvedValue({
      data: { data: { id: 1 } },
    } as never);
    vi.mocked(estimatesApi.getByRepairOrderId).mockRejectedValue(new Error("no estimate"));
    vi.mocked(estimatesApi.getAllByRepairOrderId).mockResolvedValue({ data: { data: [] } } as never);
  });

  it("given repairOrderId, when rendered, then passes it to DeliveryNoteDetail", async () => {
    render(<DeliveryNoteTab repairOrderId={42} />);

    expect(await screen.findByTestId("deliveryNote-detail")).toBeInTheDocument();
    expect(screen.getByText("DeliveryNoteDetail for RO #42")).toBeInTheDocument();
  });

  it("given no delivery note and no estimates, when rendered, then shows the shared empty state with a title and an honest description", async () => {
    vi.mocked(deliveryNotesApi.getByRepairOrderId).mockRejectedValue(new Error("not found"));

    render(<DeliveryNoteTab repairOrderId={7} />);

    const emptyState = await screen.findByTestId("empty-state");
    expect(emptyState).toHaveTextContent("Todavía no hay remito para esta orden");
    expect(emptyState).toHaveTextContent(
      "Podés generar el remito de esta orden de trabajo desde esta solapa.",
    );
  });
});
