import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PublicAppointmentPage from "./PublicAppointmentPage";

import type { PublicAppointmentResponse } from "@/types/appointment";

const { mockGet, mockConfirm, mockDecline } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockConfirm: vi.fn(),
  mockDecline: vi.fn(),
}));

vi.mock("@/api/publicAppointments", () => ({
  publicAppointmentsApi: { getByToken: mockGet, confirm: mockConfirm, decline: mockDecline },
}));

const appointment: PublicAppointmentResponse = {
  clientFirstName: "Martín",
  vehicleDescription: "Toyota Corolla (AB 123 CD)",
  purpose: "Service de 20.000 km",
  startTime: "2030-10-24T09:00:00",
  endTime: "2030-10-24T10:00:00",
  status: "SCHEDULED",
  confirmationStatus: "PENDING",
  canRespond: true,
};

function renderPage(url = "/turno/tok") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/turno/:token" element={<PublicAppointmentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicAppointmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: appointment } });
  });

  it("given a valid token, when loading, then shows the appointment details", async () => {
    renderPage();

    expect(await screen.findByText("Hola Martín, este es tu turno")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla (AB 123 CD)")).toBeInTheDocument();
    expect(screen.getByText("09:00 a 10:00")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("tok");
  });

  it("given a pending appointment, when clicking confirm, then calls API and shows confirmation", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValue({
      data: { message: "¡Gracias! Confirmaste tu turno", data: { ...appointment, confirmationStatus: "CONFIRMED" } },
    });
    renderPage("/turno/tok?respuesta=confirmar");

    await user.click(await screen.findByRole("button", { name: "Confirmar turno" }));

    await waitFor(() => expect(screen.getByText("¡Gracias! Confirmaste tu turno")).toBeInTheDocument());
    expect(screen.getByText("Turno confirmado")).toBeInTheDocument();
    expect(mockConfirm).toHaveBeenCalledWith("tok");
  });

  it("given a past appointment, when loading, then hides the response buttons", async () => {
    mockGet.mockResolvedValue({ data: { data: { ...appointment, canRespond: false } } });

    renderPage();

    expect(await screen.findByText(/Este turno ya pasó/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar turno" })).not.toBeInTheDocument();
  });

  it("given an invalid token, when loading, then shows an error", async () => {
    mockGet.mockRejectedValue(
      Object.assign(new Error("404"), { isAxiosError: true, response: { data: { message: "El enlace del turno no es válido" } } }),
    );

    renderPage("/turno/bad");

    expect(await screen.findByText("El enlace del turno no es válido")).toBeInTheDocument();
  });
});
