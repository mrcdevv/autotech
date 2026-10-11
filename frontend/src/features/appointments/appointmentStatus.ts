import type { StatusTone } from "@/theme/tokens";
import type { AppointmentResponse } from "@/types/appointment";

export type AppointmentChipColor = "primary" | "info" | "success" | "error";

export interface AppointmentStatusDisplay {
  label: string;
  tone: StatusTone;
  color: AppointmentChipColor;
}

export function getAppointmentStatus(appointment: AppointmentResponse): AppointmentStatusDisplay {
  if (appointment.status === "COMPLETED") {
    return { label: "Completada", tone: "ok", color: "success" };
  }
  if (appointment.status === "CANCELLED") {
    return { label: "Cancelada", tone: "bad", color: "error" };
  }
  if (appointment.vehicleArrivedAt) {
    return { label: "En progreso", tone: "info", color: "info" };
  }
  return { label: "Programada", tone: "neutral", color: "primary" };
}
