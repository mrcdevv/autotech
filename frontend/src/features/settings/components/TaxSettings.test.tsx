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
});
