import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicEstimatePage from "./PublicEstimatePage";

import type { PublicEstimateResponse } from "@/types/estimate";

const { mockGet, mockApprove, mockReject } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockApprove: vi.fn(),
  mockReject: vi.fn(),
}));

vi.mock("@/api/publicEstimates", () => ({
  publicEstimatesApi: { getByToken: mockGet, approve: mockApprove, reject: mockReject },
}));

const estimate: PublicEstimateResponse = {
  estimateNumber: 318,
  clientFirstName: "Martín",
  vehicleDescription: "Toyota Corolla (AB 123 CD)",
  services: [{ id: 1, serviceName: "Alineación y balanceo", price: 32000 }],
  products: [{ id: 2, productName: "Kit bujes", quantity: 2, unitPrice: 29200, totalPrice: 58400 }],
  inspectionIssues: [{ inspectionItemId: 9, itemName: "Bujes de parrilla", status: "PROBLEMA", comment: "Juego excesivo" }],
  discountPercentage: 0,
  taxPercentage: 0,
  total: 90400,
  status: "PENDIENTE",
  decisionChannel: null,
  decidedAt: null,
  expiresAt: "2030-10-24T10:00:00",
  canDecide: true,
};

function renderPage(url = "/presupuesto/tok") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/presupuesto/:token" element={<PublicEstimatePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicEstimatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: estimate } });
  });

  it("given a valid link, when loading, then shows items, total and inspection findings", async () => {
    renderPage();

    expect(await screen.findByText("Presupuesto #0318")).toBeInTheDocument();
    expect(screen.getByText("Alineación y balanceo")).toBeInTheDocument();
    expect(screen.getByText("Kit bujes x2")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("given the approve link, when the client confirms, then approves and shows the result", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({
      data: {
        message: "¡Gracias! Aprobaste el presupuesto. Ya avisamos al taller",
        data: { ...estimate, status: "ACEPTADO", canDecide: false, decisionChannel: "EMAIL_LINK" },
      },
    });
    renderPage("/presupuesto/tok?decision=aprobar");

    await user.click(await screen.findByRole("button", { name: "Sí, aprobar presupuesto" }));

    await waitFor(() => expect(screen.getByText(/Aprobaste el presupuesto/)).toBeInTheDocument());
    expect(screen.getByText("Presupuesto aprobado")).toBeInTheDocument();
    expect(mockApprove).toHaveBeenCalledWith("tok");
  });

  it("given the page is opened, when nothing is clicked, then no decision is sent", async () => {
    renderPage("/presupuesto/tok?decision=rechazar");

    expect(await screen.findByRole("button", { name: "Sí, rechazar presupuesto" })).toBeInTheDocument();
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("given an already decided estimate, when loading, then shows it without action buttons", async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...estimate, status: "RECHAZADO", canDecide: false, decidedAt: "2026-10-17T10:00:00" } },
    });

    renderPage();

    expect(await screen.findByText("Este presupuesto ya fue rechazado el 17/10/2026.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar presupuesto" })).not.toBeInTheDocument();
  });
});
