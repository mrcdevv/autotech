import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { StockAdjustmentDialog } from "./StockAdjustmentDialog";

import type { ProductResponse } from "@/types/catalog";

const product: ProductResponse = {
  id: 7,
  name: "Aceite 5W30",
  description: null,
  quantity: 10,
  unitPrice: 100,
  createdAt: "",
  updatedAt: "",
  minStock: 2,
  reservedQuantity: 3,
  availableQuantity: 7,
  lowStock: false,
};

describe("StockAdjustmentDialog", () => {
  it("given the dialog, when rendered, then shows on hand, reserved and available", () => {
    render(<StockAdjustmentDialog open product={product} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText(/En stock:/)).toHaveTextContent("En stock: 10 · Reservado: 3 · Disponible: 7");
  });

  it("given no reason, when saving, then asks for it and does not call onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<StockAdjustmentDialog open product={product} onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/^Cantidad/), "5");
    await user.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(screen.getByText("El motivo es obligatorio")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("given an increase with reason, when saving, then sends mode, quantity and trimmed reason", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<StockAdjustmentDialog open product={product} onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/^Cantidad/), "5");
    await user.type(screen.getByLabelText(/^Motivo/), "  Compra a proveedor ");

    expect(screen.getByText("El stock en mano quedará en 15.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(onSave).toHaveBeenCalledWith({ mode: "INCREASE", quantity: 5, reason: "Compra a proveedor" });
  });

  it("given a physical count equal to on hand, when saving, then explains nothing would change", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<StockAdjustmentDialog open product={product} onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByLabelText(/Tipo de ajuste/));
    await user.click(screen.getByRole("option", { name: /Conteo físico/ }));
    await user.type(screen.getByLabelText(/^Cantidad contada/), "10");
    await user.type(screen.getByLabelText(/^Motivo/), "Conteo");
    await user.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(screen.getByText("El ajuste no modifica el stock actual")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
