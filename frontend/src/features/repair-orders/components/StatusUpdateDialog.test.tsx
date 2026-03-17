import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { StatusUpdateDialog } from "./StatusUpdateDialog";

describe("StatusUpdateDialog", () => {
  const defaultProps = {
    open: true,
    currentStatus: "INGRESO_VEHICULO" as const,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it("given dialog open, when rendered, then shows only updatable statuses", () => {
    render(<StatusUpdateDialog {...defaultProps} />);

    expect(screen.getByText("Esperando repuestos")).toBeInTheDocument();
    expect(screen.getByText("Reparación")).toBeInTheDocument();
    expect(screen.getByText("Pruebas")).toBeInTheDocument();
    expect(screen.getByText("Listo para entregar")).toBeInTheDocument();
    expect(screen.getByText("Entregado")).toBeInTheDocument();
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
});
