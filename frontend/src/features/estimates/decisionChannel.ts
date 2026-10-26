import dayjs from "dayjs";

import type { EstimateDecisionChannel, EstimateDetailResponse, StaffDecisionChannel } from "@/types/estimate";

export const DECISION_CHANNEL_LABELS: Record<EstimateDecisionChannel, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Teléfono",
  IN_PERSON: "En persona",
  EMAIL_LINK: "enlace del email",
};

export const STAFF_DECISION_CHANNELS: StaffDecisionChannel[] = ["WHATSAPP", "PHONE", "IN_PERSON"];

/**
 * One-line summary of who decided an estimate and how, e.g.
 * "Aprobado por el cliente desde el enlace del email el 17/10/2026 18:30".
 */
export function describeDecision(
  estimate: Pick<EstimateDetailResponse, "status" | "decisionChannel" | "decidedAt" | "decidedByEmployeeName">,
): string | null {
  if (estimate.status === "PENDIENTE" || !estimate.decisionChannel) return null;
  const verb = estimate.status === "ACEPTADO" ? "Aprobado" : "Rechazado";
  const when = estimate.decidedAt ? ` el ${dayjs(estimate.decidedAt).format("DD/MM/YYYY HH:mm")}` : "";
  if (estimate.decisionChannel === "EMAIL_LINK") {
    return `${verb} por el cliente desde el enlace del email${when}`;
  }
  const by = estimate.decidedByEmployeeName ? ` · registrado por ${estimate.decidedByEmployeeName}` : "";
  return `${verb} por ${DECISION_CHANNEL_LABELS[estimate.decisionChannel]}${when}${by}`;
}
