import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopUnpaidInvoicesList } from "./TopUnpaidInvoicesList";

describe("TopUnpaidInvoicesList", () => {
  it("given invoices, when rendered, then shows client names and totals", () => {
    const invoices = [
      {
        invoiceId: 1,
        clientFullName: "Juan Perez",
        vehiclePlate: "ABC123",
        total: 5000,
        createdAt: "2026-01-15T10:00:00",
      },
    ];

    render(<TopUnpaidInvoicesList invoices={invoices} />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("given no invoices, when rendered, then shows empty state", () => {
    render(<TopUnpaidInvoicesList invoices={[]} />);

    expect(screen.getByText("No hay facturas pendientes")).toBeInTheDocument();
  });
});
