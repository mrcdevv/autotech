import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import { InvoiceTab } from "./InvoiceTab";

vi.mock("./InvoiceDetail", () => ({
  InvoiceDetail: ({ repairOrderId }: { repairOrderId: number }) => (
    <div data-testid="invoice-detail">InvoiceDetail for RO #{repairOrderId}</div>
  ),
}));

describe("InvoiceTab", () => {
  it("given repairOrderId, when rendered, then passes it to InvoiceDetail", () => {
    render(<InvoiceTab repairOrderId={42} />);

    expect(screen.getByTestId("invoice-detail")).toBeInTheDocument();
    expect(screen.getByText("InvoiceDetail for RO #42")).toBeInTheDocument();
  });
});
