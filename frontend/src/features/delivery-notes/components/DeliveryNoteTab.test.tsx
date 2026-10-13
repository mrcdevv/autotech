import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { DeliveryNoteTab } from "./DeliveryNoteTab";

vi.mock("./DeliveryNoteDetail", () => ({
  DeliveryNoteDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="deliveryNote-detail">DeliveryNoteDetail for RO #{repairOrderId}</div>
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
  it("given repairOrderId, when rendered, then passes it to DeliveryNoteDetail", async () => {
    render(<DeliveryNoteTab repairOrderId={42} />);

    expect(await screen.findByTestId("deliveryNote-detail")).toBeInTheDocument();
    expect(screen.getByText("DeliveryNoteDetail for RO #42")).toBeInTheDocument();
  });
});
