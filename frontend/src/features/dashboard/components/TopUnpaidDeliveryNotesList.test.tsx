import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopUnpaidDeliveryNotesList } from "./TopUnpaidDeliveryNotesList";

describe("TopUnpaidDeliveryNotesList", () => {
  it("given deliveryNotes, when rendered, then shows client names and totals", () => {
    const deliveryNotes = [
      {
        deliveryNoteId: 1,
        clientFullName: "Juan Perez",
        vehiclePlate: "ABC123",
        total: 5000,
        createdAt: "2026-01-15T10:00:00",
      },
    ];

    render(<TopUnpaidDeliveryNotesList deliveryNotes={deliveryNotes} />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("given no deliveryNotes, when rendered, then shows empty state", () => {
    render(<TopUnpaidDeliveryNotesList deliveryNotes={[]} />);

    expect(screen.getByText("No hay remitos pendientes")).toBeInTheDocument();
  });
});
