import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { StatusUpdateDialog } from "./StatusUpdateDialog";

const mockGetDeliveryNoteByRepairOrderId = vi.fn();

vi.mock("@/api/deliveryNotes", () => ({
  deliveryNotesApi: {
    getByRepairOrderId: (...args: unknown[]) => mockGetDeliveryNoteByRepairOrderId(...args),
  },
}));

describe("StatusUpdateDialog", () => {
  const defaultProps = {
    open: true,
    currentStatus: "INGRESO_VEHICULO" as const,
    repairOrderId: 7,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    mockGetDeliveryNoteByRepairOrderId.mockReset();
  });

  it("given dialog open, when rendered, then shows only updatable statuses", () => {
    render(<StatusUpdateDialog {...defaultProps} />);

    expect(screen.getByText("Esperando repuestos")).toBeInTheDocument();
    expect(screen.getByText("Reparación")).toBeInTheDocument();
    expect(screen.getByText("Pruebas")).toBeInTheDocument();
    expect(screen.getByText("Listo para entregar")).toBeInTheDocument();
    expect(screen.getByText("Entregado")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryByText("Ingresó vehículo")).not.toBeInTheDocument();
  });

  it("given current status in updatable list, when rendered, then disables current status radio", () => {
    render(
      <StatusUpdateDialog
        {...defaultProps}
        currentStatus="REPARACION"
      />,
    );

    const reparacionRadio = screen.getByLabelText("Reparación");
    expect(reparacionRadio).toBeDisabled();
  });

  it("given selected status, when clicking Aceptar, then shows confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<StatusUpdateDialog {...defaultProps} />);

    await user.click(screen.getByLabelText("Reparación"));
    await user.click(screen.getByText("Aceptar"));

    expect(screen.getByText("Confirmar cambio de estado")).toBeInTheDocument();
  });

  it("given confirmation dialog, when clicking Confirmar, then calls onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<StatusUpdateDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText("Reparación"));
    await user.click(screen.getByText("Aceptar"));
    await user.click(screen.getByText("Confirmar"));

    expect(onConfirm).toHaveBeenCalledWith("REPARACION");
  });

  it("given no delivery note, when confirming delivery, then confirmation warns about closing without one", async () => {
    const user = userEvent.setup();
    mockGetDeliveryNoteByRepairOrderId.mockRejectedValue(new Error("404"));
    render(<StatusUpdateDialog {...defaultProps} />);

    await user.click(screen.getByLabelText("Entregado"));
    await user.click(screen.getByText("Aceptar"));

    expect(mockGetDeliveryNoteByRepairOrderId).toHaveBeenCalledWith(7);
    expect(
      screen.getByText(
        /no tiene un remito asociado.*no se podrá crear ni asociar ningún remito/i,
      ),
    ).toBeInTheDocument();
  });

  it("given existing delivery note, when confirming delivery, then confirmation does not warn", async () => {
    const user = userEvent.setup();
    mockGetDeliveryNoteByRepairOrderId.mockResolvedValue({ data: { data: { id: 9 } } });
    render(<StatusUpdateDialog {...defaultProps} />);

    await user.click(screen.getByLabelText("Entregado"));
    await user.click(screen.getByText("Aceptar"));

    expect(mockGetDeliveryNoteByRepairOrderId).toHaveBeenCalledWith(7);
    expect(screen.queryByText(/remito asociado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/¿Está seguro de cambiar de/)).toBeInTheDocument();
  });

  it("given delivery warning, when clicking Confirmar, then status change is still executed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    mockGetDeliveryNoteByRepairOrderId.mockRejectedValue(new Error("404"));
    render(<StatusUpdateDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText("Entregado"));
    await user.click(screen.getByText("Aceptar"));
    await user.click(screen.getByText("Confirmar"));

    expect(onConfirm).toHaveBeenCalledWith("ENTREGADO");
  });

  it("given non-delivery status, when clicking Aceptar, then delivery-notes API is not called", async () => {
    const user = userEvent.setup();
    render(<StatusUpdateDialog {...defaultProps} />);

    await user.click(screen.getByLabelText("Reparación"));
    await user.click(screen.getByText("Aceptar"));

    expect(mockGetDeliveryNoteByRepairOrderId).not.toHaveBeenCalled();
  });
});
