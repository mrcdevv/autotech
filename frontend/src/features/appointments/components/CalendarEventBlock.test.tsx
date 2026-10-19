import { fireEvent, render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll } from "vitest";

import { CalendarEventBlock } from "./CalendarEventBlock";

import type { AppointmentResponse, AppointmentStatus } from "@/types/appointment";

// jsdom has no PointerEvent, so fireEvent.pointer* would drop clientY/buttons.
beforeAll(() => {
  if (typeof window.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
  }
});

const baseAppointment: AppointmentResponse = {
  id: 7,
  title: "Cambio de aceite",
  clientId: 1,
  clientFullName: "Juan Perez",
  clientEmail: null,
  vehicleId: null,
  vehiclePlate: null,
  vehicleBrand: null,
  vehicleModel: null,
  purpose: null,
  startTime: "2025-03-15T10:00:00",
  endTime: "2025-03-15T11:00:00",
  vehicleDeliveryMethod: null,
  status: "SCHEDULED",
  vehicleArrivedAt: null,
  vehiclePickedUpAt: null,
  clientArrived: false,
  confirmationStatus: "PENDING",
  confirmedAt: null,
  employees: [],
  tags: [],
  createdAt: "",
  updatedAt: "",
};

// hourHeight 60 => 1px per minute, 15px snap
function renderBlock(status: AppointmentStatus = "SCHEDULED") {
  const onClick = vi.fn();
  const onReschedule = vi.fn();
  render(
    <CalendarEventBlock
      appointment={{ ...baseAppointment, status }}
      top={120}
      height={60}
      left="0"
      width="100%"
      zIndex={1}
      groupSize={1}
      dateStr="2025-03-15"
      startHour={8}
      endHour={20}
      hourHeight={60}
      onClick={onClick}
      onMenuOpen={vi.fn()}
      onReschedule={onReschedule}
    />,
  );
  return { onClick, onReschedule, card: screen.getByText("Cambio de aceite") };
}

describe("CalendarEventBlock", () => {
  it("given a scheduled appointment, when dragged, then reschedules it", () => {
    const { onReschedule, card } = renderBlock();

    fireEvent.pointerDown(card, { pointerId: 1, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(card, { pointerId: 1, clientY: 160, buttons: 1 });
    fireEvent.pointerUp(card, { pointerId: 1, clientY: 160, buttons: 0 });

    expect(onReschedule).toHaveBeenCalledWith(7, "2025-03-15T11:00:00", "2025-03-15T12:00:00");
  });

  it.each<AppointmentStatus>(["COMPLETED", "CANCELLED"])(
    "given a %s appointment, when dragged, then does not reschedule it",
    (status) => {
      const { onReschedule, card } = renderBlock(status);

      fireEvent.pointerDown(card, { pointerId: 1, clientY: 100, buttons: 1 });
      fireEvent.pointerMove(card, { pointerId: 1, clientY: 160, buttons: 1 });
      fireEvent.pointerUp(card, { pointerId: 1, clientY: 160, buttons: 0 });

      expect(onReschedule).not.toHaveBeenCalled();
      expect(screen.queryByTestId("appointment-resize-handle")).not.toBeInTheDocument();
    },
  );

  it("given a completed appointment, when clicked, then opens the detail", () => {
    const { onClick, card } = renderBlock("COMPLETED");

    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("given a scheduled appointment, when clicked without moving, then opens the detail", () => {
    const { onClick, onReschedule, card } = renderBlock();

    fireEvent.pointerDown(card, { pointerId: 1, clientY: 100, buttons: 1 });
    fireEvent.pointerUp(card, { pointerId: 1, clientY: 100, buttons: 0 });
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onReschedule).not.toHaveBeenCalled();
  });

  it("given a pointer released outside the card, when hovering later without buttons, then does not move it", () => {
    const { onReschedule, card } = renderBlock();

    fireEvent.pointerDown(card, { pointerId: 1, clientY: 100, buttons: 1 });
    fireEvent.pointerUp(window, { pointerId: 1, clientY: 102, buttons: 0 });
    fireEvent.pointerMove(card, { pointerId: 1, clientY: 200, buttons: 0 });
    fireEvent.pointerUp(card, { pointerId: 1, clientY: 200, buttons: 0 });

    expect(onReschedule).not.toHaveBeenCalled();
  });

  it("given a pending gesture, when the pointer moves with no button pressed, then cancels it without saving", () => {
    const { onReschedule, card } = renderBlock();

    fireEvent.pointerDown(card, { pointerId: 1, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(card, { pointerId: 1, clientY: 200, buttons: 0 });
    fireEvent.pointerUp(card, { pointerId: 1, clientY: 200, buttons: 0 });

    expect(onReschedule).not.toHaveBeenCalled();
  });

  it("given the resize handle, when clicked without moving, then does not open the detail", () => {
    const { onClick } = renderBlock();
    const handle = screen.getByTestId("appointment-resize-handle");

    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 180, buttons: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 180, buttons: 0 });
    fireEvent.click(handle);

    expect(onClick).not.toHaveBeenCalled();
  });
});
