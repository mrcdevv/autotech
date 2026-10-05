import type { StatusTone } from "@/theme/tokens";

import { dot } from "@/theme/tokens";

import type { RepairOrderStatus } from "./types";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  color: string;
  progress: number;
  priority: number;
}

export const STATUS_META: Record<RepairOrderStatus, StatusMeta> = {
  REPARACION: { label: "Reparación", tone: "info", color: dot.info, progress: 80, priority: 0 },
  PRUEBAS: { label: "Pruebas", tone: "testing", color: dot.testing, progress: 80, priority: 0 },
  ESPERANDO_REPUESTOS: { label: "Esp. repuestos", tone: "parts", color: dot.parts, progress: 60, priority: 1 },
  ESPERANDO_APROBACION_PRESUPUESTO: {
    label: "Esp. aprobación",
    tone: "warn",
    color: dot.warn,
    progress: 40,
    priority: 2,
  },
  INGRESO_VEHICULO: { label: "Ingreso", tone: "neutral", color: dot.neutral, progress: 20, priority: 3 },
  LISTO_PARA_ENTREGAR: { label: "Listo p/ entregar", tone: "ok", color: dot.ok, progress: 100, priority: 4 },
  ENTREGADO: { label: "Entregado", tone: "done", color: dot.done, progress: 100, priority: 5 },
  CANCELADO: { label: "Cancelada", tone: "bad", color: dot.bad, progress: 0, priority: 6 },
};
