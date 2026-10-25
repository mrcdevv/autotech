import { describe, it, expect } from "vitest";

import { movementEffect, movementSource } from "./stockMovementLabels";

import type { StockMovementResponse } from "@/types/catalog";

const base: StockMovementResponse = {
  id: 1,
  productId: 7,
  type: "CONSUME",
  quantity: 3,
  sourceType: "REPAIR_ORDER",
  sourceId: 12,
  reason: null,
  createdByName: null,
  createdAt: "2026-10-19T10:00:00",
};

describe("stockMovementLabels", () => {
  it("given each movement type, when describing its effect, then signs on-hand and reserved changes", () => {
    expect(movementEffect({ ...base, type: "CONSUME" })).toBe("-3 en stock");
    expect(movementEffect({ ...base, type: "RETURN" })).toBe("+3 en stock");
    expect(movementEffect({ ...base, type: "RESERVE" })).toBe("+3 reservado");
    expect(movementEffect({ ...base, type: "RELEASE" })).toBe("-3 reservado");
    expect(movementEffect({ ...base, type: "ADJUSTMENT", quantity: -4 })).toBe("-4 en stock");
    expect(movementEffect({ ...base, type: "INITIAL", quantity: 10 })).toBe("+10 en stock");
  });

  it("given each source, when describing the origin, then names the document", () => {
    expect(movementSource(base)).toBe("Orden de trabajo #12");
    expect(movementSource({ ...base, sourceType: "DELIVERY_NOTE", sourceId: 5 })).toBe("Remito #5");
    expect(movementSource({ ...base, sourceType: "MANUAL", sourceId: null })).toBe("Manual");
  });
});
