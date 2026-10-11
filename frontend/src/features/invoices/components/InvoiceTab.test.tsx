import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { InvoiceTab } from "./InvoiceTab";

vi.mock("./InvoiceDetail", () => ({
  InvoiceDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="invoice-detail">InvoiceDetail for RO #{repairOrderId}</div>
  ),
}));

vi.mock("@/api/invoices", () => ({
  invoicesApi: {
    getByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
  },
}));

vi.mock("@/api/estimates", () => ({
  estimatesApi: {
    getByRepairOrderId: vi.fn().mockRejectedValue(new Error("no estimate")),
    getAllByRepairOrderId: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

describe("InvoiceTab", () => {
  it("given repairOrderId, when rendered, then passes it to InvoiceDetail", async () => {
    render(<InvoiceTab repairOrderId={42} />);

    expect(await screen.findByTestId("invoice-detail")).toBeInTheDocument();
    expect(screen.getByText("InvoiceDetail for RO #42")).toBeInTheDocument();
  });
});
