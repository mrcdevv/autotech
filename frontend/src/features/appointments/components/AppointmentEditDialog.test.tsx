import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { AppointmentEditDialog } from "./AppointmentEditDialog";

import type { AppointmentResponse } from "@/types/appointment";

const tomorrow = dayjs().add(1, "day").hour(9).minute(0).second(0);

const base: AppointmentResponse = {
  id: 1,
  title: "Cita",
  clientId: 3,
  clientFullName: "Juan Perez",
  clientEmail: "juan@test.com",
  vehicleId: null,
  vehiclePlate: null,
  vehicleBrand: null,
  vehicleModel: null,
  purpose: null,
  startTime: tomorrow.format("YYYY-MM-DDTHH:mm:ss"),
  endTime: tomorrow.add(1, "hour").format("YYYY-MM-DDTHH:mm:ss"),
  vehicleDeliveryMethod: null,
  status: "SCHEDULED",
  vehicleArrivedAt: null,
  vehiclePickedUpAt: null,
  clientArrived: false,
  confirmationStatus: "PENDING",
  confirmedAt: null,
  employees: [],
  tags: [],
  createdAt: "2026-01-01T00:00:00",
  updatedAt: "2026-01-01T00:00:00",
};

describe("AppointmentEditDialog", () => {
  it("given a future appointment of a client with email, when opening, then notify checkbox is checked", () => {
    render(<AppointmentEditDialog open appointment={base} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Notificar al cliente por email" })).toBeChecked();
  });

  it("given a client already at the workshop, when opening, then notify checkbox is unchecked", () => {
    render(
      <AppointmentEditDialog open appointment={{ ...base, clientArrived: true }} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(screen.getByRole("checkbox", { name: "Notificar al cliente por email" })).not.toBeChecked();
  });

  it("given a client without email, when opening, then checkbox is disabled with a hint", () => {
    render(
      <AppointmentEditDialog open appointment={{ ...base, clientEmail: null }} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(screen.getByRole("checkbox", { name: "Notificar al cliente por email" })).toBeDisabled();
    expect(screen.getByText("El cliente no tiene email cargado")).toBeInTheDocument();
  });

  it("given the user unchecks the box, when saving, then sends notifyClient false", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AppointmentEditDialog open appointment={base} onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByRole("checkbox", { name: "Notificar al cliente por email" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith(1, expect.objectContaining({ notifyClient: false }));
  });
});
