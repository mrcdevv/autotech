import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaxSettings } from "./TaxSettings";

const { mockGetConfig, mockUpdateConfig } = vi.hoisted(() => ({
  mockGetConfig: vi.fn(),
  mockUpdateConfig: vi.fn(),
}));

vi.mock("@/api/taxConfig", () => ({
  taxConfigApi: {
    getConfig: mockGetConfig,
    updateConfig: mockUpdateConfig,
  },
}));

describe("TaxSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue({
      data: {
        data: {
          id: 1,
          taxPercentage: 21,
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
        },
      },
    });
    mockUpdateConfig.mockResolvedValue({
      data: {
        data: {
          id: 1,
          taxPercentage: 21,
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
        },
      },
    });
  });

  it("given config loaded, when rendered, then shows loaded tax percentage", async () => {
    render(<TaxSettings />);

    const input = await screen.findByLabelText("IVA por defecto (%)");
    expect(input).toHaveValue(21);
  });

  it("given valid value, when saving, then calls updateConfig with the value", async () => {
    const user = userEvent.setup();
    render(<TaxSettings />);

    const input = await screen.findByLabelText("IVA por defecto (%)");
    await user.clear(input);
    await user.type(input, "15");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({ taxPercentage: 15 });
    });
  });

  it("given an empty field, when editing, then disables Guardar and shows a validation message", async () => {
    const user = userEvent.setup();
    render(<TaxSettings />);

    const input = await screen.findByLabelText("IVA por defecto (%)");
    await user.clear(input);

    expect(screen.getByText("Ingresá un porcentaje de IVA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("given a value above 100, when editing, then disables Guardar and shows the range message", async () => {
    const user = userEvent.setup();
    render(<TaxSettings />);

    const input = await screen.findByLabelText("IVA por defecto (%)");
    await user.clear(input);
    await user.type(input, "150");

    expect(screen.getByText("El IVA debe estar entre 0 y 100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});
