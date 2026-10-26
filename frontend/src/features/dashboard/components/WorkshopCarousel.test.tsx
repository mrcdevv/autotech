import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkshopCarousel } from "./WorkshopCarousel";
import type { WorkshopCarouselItem } from "../utils/homeView";

const baseItem: WorkshopCarouselItem = {
  id: 12,
  position: 1,
  puesto: "Puesto 1",
  ot: "OT-12",
  plate: "AB123CD",
  vehicle: "2020 Toyota Corolla",
  client: "Juan Perez",
  task: "Cambio de aceite",
  statusLabel: "Reparación",
  tone: "info",
  color: "#3B82F6",
  progress: 80,
  mechanics: [],
};

const threeMechanics = [
  { id: 1, initials: "CL", fullName: "Carlos Lopez" },
  { id: 2, initials: "AG", fullName: "Ana Garcia" },
  { id: 3, initials: "BD", fullName: "Bruno Diaz" },
];

describe("WorkshopCarousel", () => {
  it("given an item with three mechanics, then renders three initials avatars and all names joined by commas", () => {
    render(
      <WorkshopCarousel
        items={[{ ...baseItem, mechanics: threeMechanics }]}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText("Carlos Lopez, Ana Garcia, Bruno Diaz")).toBeInTheDocument();
    for (const initials of ["CL", "AG", "BD"]) {
      expect(screen.getAllByText(initials)).toHaveLength(1);
    }
  });

  it("given an item with no mechanics, then shows Sin asignar and no avatar initials", () => {
    render(<WorkshopCarousel items={[baseItem]} onOpen={vi.fn()} />);

    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.queryByText("CL")).not.toBeInTheDocument();
    expect(screen.queryByText("Carlos Lopez")).not.toBeInTheDocument();
  });

  it("given an item, then keeps the OT code visible", () => {
    render(
      <WorkshopCarousel
        items={[{ ...baseItem, mechanics: [threeMechanics[0]!] }]}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText("OT-12")).toBeInTheDocument();
  });
});
