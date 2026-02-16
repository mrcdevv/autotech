import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { CannedJobFormDialog } from "./CannedJobFormDialog";

import type { CannedJobDetailResponse } from "@/types/catalog";

vi.mock("@/api/catalogServices", () => ({
  catalogServicesApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

vi.mock("@/api/products", () => ({
  productsApi: {
    search: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
  },
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: null,
};

const sampleDetail: CannedJobDetailResponse = {
  id: 1,
  title: "Full Service",
  description: "Complete vehicle service",
  services: [{ id: 1, serviceName: "Oil Change", price: 50 }],
  products: [{ id: 1, productName: "Oil Filter", quantity: 1, unitPrice: 15 }],
  createdAt: "",
  updatedAt: "",
};

describe("CannedJobFormDialog", () => {
  it("given create mode, when opened, then shows empty fields", () => {
    render(<CannedJobFormDialog {...defaultProps} />);

    expect(screen.getByText("Nuevo trabajo enlatado")).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toHaveValue("");
    expect(screen.getByLabelText(/descripción/i)).toHaveValue("");
  });

  it("given edit mode with initial data, when opened, then shows pre-filled fields", () => {
    render(<CannedJobFormDialog {...defaultProps} initialData={sampleDetail} />);

    expect(screen.getByText("Editar trabajo enlatado")).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toHaveValue("Full Service");
  });

  it("given form, when clicking agregar servicio, then adds a service row", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar servicio/i }));

    expect(screen.getByLabelText("Nombre del servicio")).toBeInTheDocument();
    expect(screen.getByLabelText("Precio")).toBeInTheDocument();
  });

  it("given form, when clicking agregar producto, then adds a product row", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar producto/i }));

    expect(screen.getByLabelText("Nombre del producto")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad")).toBeInTheDocument();
    expect(screen.getByLabelText("Precio unitario")).toBeInTheDocument();
  });

  it("given empty title, when clicking guardar, then shows validation error", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CannedJobFormDialog {...defaultProps} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(screen.getByText("El título es obligatorio")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("given valid data, when clicking guardar, then calls onSave with correct data", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CannedJobFormDialog {...defaultProps} onSave={onSave} />);

    await user.type(screen.getByLabelText(/título/i), "New Job");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith({
      title: "New Job",
      description: null,
      services: [],
      products: [],
    });
  });

  it("given form, when clicking cancelar, then calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CannedJobFormDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
