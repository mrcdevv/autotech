import type { StatusTone } from "@/theme/tokens";
import type { StockMovementResponse, StockMovementType } from "@/types/catalog";

export const STOCK_MOVEMENT_TYPES: Record<StockMovementType, { label: string; tone: StatusTone }> = {
  INITIAL: { label: "Stock inicial", tone: "neutral" },
  ADJUSTMENT: { label: "Ajuste manual", tone: "info" },
  RESERVE: { label: "Reserva", tone: "warn" },
  RELEASE: { label: "Liberación", tone: "neutral" },
  CONSUME: { label: "Consumo", tone: "bad" },
  RETURN: { label: "Devolución", tone: "ok" },
};

/** On-hand / reserved effect of a movement, signed so the history reads at a glance. */
export function movementEffect(movement: StockMovementResponse): string {
  switch (movement.type) {
    case "INITIAL":
    case "ADJUSTMENT":
      return `${movement.quantity > 0 ? "+" : ""}${movement.quantity} en stock`;
    case "RESERVE":
      return `+${movement.quantity} reservado`;
    case "RELEASE":
      return `-${movement.quantity} reservado`;
    case "CONSUME":
      return `-${movement.quantity} en stock`;
    case "RETURN":
      return `+${movement.quantity} en stock`;
  }
}

export function movementSource(movement: StockMovementResponse): string {
  if (movement.sourceType === "REPAIR_ORDER") return `Orden de trabajo #${movement.sourceId}`;
  if (movement.sourceType === "DELIVERY_NOTE") return `Remito #${movement.sourceId}`;
  return "Manual";
}
