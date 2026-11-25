import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { ApplyCannedJobDialog } from "./ApplyCannedJobDialog";

import { cannedJobsApi } from "@/api/cannedJobs";
import type { CannedJobDetailResponse } from "@/types/catalog";

vi.mock("@/api/cannedJobs", () => ({
  cannedJobsApi: {
    search: vi.fn().mockResolvedValue({
      data: {
        data: {
          content: [
            { id: 1, title: "Service 10.000 km", description: null, createdAt: "", updatedAt: "" },
            { id: 2, title: "Brake overhaul", description: null, createdAt: "", updatedAt: "" },
          ],
        },
      },
    }),
    getById: vi.fn(),
  },
}));

const cannedJobDetail: CannedJobDetailResponse = {
  id: 1,
  title: "Service 10.000 km",
  description: "Full service",
  services: [{ id: 11, serviceName: "Oil change", price: 100 }],
  products: [{ id: 21, productName: "Oil 5W-30", quantity: 2, unitPrice: 50, productId: 301 }],
  createdAt: "",
  updatedAt: "",
};

function mockDetail(detail: CannedJobDetailResponse) {
  vi.mocked(cannedJobsApi.getById).mockResolvedValue({
    data: { data: detail, status: "success", message: null },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as never,
  });
}

describe("ApplyCannedJobDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetail(cannedJobDetail);
  });


  it("given an open dialog, when rendered, then shows the paquete picker", () => {
    render(<ApplyCannedJobDialog open onClose={vi.fn()} onApply={vi.fn()} />);

    expect(screen.getByLabelText(/Buscar paquete/i)).toBeInTheDocument();
  });

  it("given a selected canned job, when its detail loads, then lists services and products with a total", async () => {
    const user = userEvent.setup();
    render(<ApplyCannedJobDialog open onClose={vi.fn()} onApply={vi.fn()} />);

    await user.click(screen.getByLabelText(/Buscar paquete/i));
    await user.click(await screen.findByText("Service 10.000 km"));

    expect(await screen.findByText("Oil change")).toBeInTheDocument();
    expect(screen.getByText("Oil 5W-30")).toBeInTheDocument();
    // 100 service + 2 × 50 product
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it("given a loaded canned job, when clicking insertar, then calls onApply with expanded lines", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<ApplyCannedJobDialog open onClose={vi.fn()} onApply={onApply} />);

    await user.click(screen.getByLabelText(/Buscar paquete/i));
    await user.click(await screen.findByText("Service 10.000 km"));
    await screen.findByText("Oil change");

    await user.click(screen.getByRole("button", { name: "Insertar" }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith(
        {
          services: [{ serviceName: "Oil change", price: 100 }],
          products: [{ productName: "Oil 5W-30", quantity: 2, unitPrice: 50, productId: 301 }],
        },
        cannedJobDetail,
      );
    });
  });

  it("given no selection, when rendered, then insertar is disabled", () => {
    render(<ApplyCannedJobDialog open onClose={vi.fn()} onApply={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Insertar" })).toBeDisabled();
  });
});
