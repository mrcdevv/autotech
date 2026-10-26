import dayjs from "dayjs";

import type { Dayjs } from "dayjs";
import type { AppointmentConfirmationStatus } from "@/types/appointment";
import type { StatusTone } from "@/theme/tokens";

export const NO_CLIENT_EMAIL_HINT = "El cliente no tiene email cargado";

interface NotifyClientDefaultInput {
  hasEmail: boolean;
  startTime: Dayjs | string | null;
  clientArrived?: boolean;
  now?: Dayjs;
}

/**
 * Default state of the "Notificar al cliente por email" checkbox:
 * checked when the slot is in the future and the client has an email,
 * unchecked when the client is already at the workshop or has no email.
 */
export function getNotifyClientDefault({
  hasEmail,
  startTime,
  clientArrived = false,
  now = dayjs(),
}: NotifyClientDefaultInput): boolean {
  if (!hasEmail || clientArrived || !startTime) return false;
  return dayjs(startTime).isAfter(now);
}

export function hasEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().length > 0;
}

export const CONFIRMATION_STATUS_DISPLAY: Record<AppointmentConfirmationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Sin confirmar", tone: "warn" },
  CONFIRMED: { label: "Confirmado por el cliente", tone: "ok" },
  DECLINED: { label: "El cliente no puede asistir", tone: "bad" },
};
