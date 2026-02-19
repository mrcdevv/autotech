import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReadyForPickupList } from "./ReadyForPickupList";

describe("ReadyForPickupList", () => {
  it("given orders, when rendered, then shows client names and phone numbers", () => {
    const orders = [
      {
        repairOrderId: 1,
        title: "Cambio de aceite",
        clientFullName: "Juan Perez",
        clientPhone: "11-2345-6789",
        vehiclePlate: "ABC123",
      },
    ];

    render(<ReadyForPickupList orders={orders} />);

    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("11-2345-6789")).toBeInTheDocument();
  });

  it("given no orders, when rendered, then shows empty state", () => {
    render(<ReadyForPickupList orders={[]} />);

    expect(screen.getByText("No hay vehículos listos para entregar")).toBeInTheDocument();
  });

  it("given orders, when rendered, then shows phone call link", () => {
    const orders = [
      {
        repairOrderId: 1,
        title: null,
        clientFullName: "Maria Garcia",
        clientPhone: "11-9876-5432",
        vehiclePlate: "XYZ789",
      },
    ];

    render(<ReadyForPickupList orders={orders} />);

    const phoneLink = screen.getByRole("link");
    expect(phoneLink).toHaveAttribute("href", "tel:11-9876-5432");
  });
});
