import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { CannedJobFormDialog } from "./CannedJobFormDialog";
import { formatCurrency } from "@/utils/formatCurrency";

import type { CannedJobDetailResponse } from "@/types/catalog";

// formatCurrency emits a non-breaking space (U+00A0) after the "$" symbol, which the
// testing-library normalizer collapses to a plain space in the DOM text. Normalize the
// expectation the same way so exact string matching works.
const money = (value: number) => formatCurrency(value).replace(/\u00A0/g, " ");

vi.mock("@/api/catalogServices", () => ({
  catalogServicesApi: {
    search: vi.fn().mockResolvedValue({
      data: {
        data: {
          content: [
            { id: 1, name: "Oil Change", description: null, price: 1234.5, createdAt: "", updatedAt: "" },
          ],
        },
      },
    }),
  },
}));

vi.mock("@/api/products", () => ({
  productsApi: {
    search: vi.fn().mockResolvedValue({
      data: {
        data: {
          content: [
            { id: 2, name: "Oil Filter", description: null, quantity: 7, unitPrice: 1234.5, createdAt: "", updatedAt: "" },
          ],
        },
      },
    }),
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

    expect(screen.getByText("Nuevo paquete de servicios")).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toHaveValue("");
    expect(screen.getByLabelText(/descripción/i)).toHaveValue("");
  });

  it("given edit mode with initial data, when opened, then shows pre-filled fields", () => {
    render(<CannedJobFormDialog {...defaultProps} initialData={sampleDetail} />);

    expect(screen.getByText("Editar paquete de servicios")).toBeInTheDocument();
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

  it("given a service price input, when a price is typed, then the input is right-aligned but its value stays the raw editable number (decision D5)", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar servicio/i }));
    const priceInput = screen.getByLabelText("Precio");
    await user.type(priceInput, "1234.5");

    // Positive assertion: the inline style is reflected in jsdom's getComputedStyle.
    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    // D5 guard: the value must be the raw number the user is typing, never a
    // currency string like "$ 1.234,50".
    expect(priceInput).toHaveValue(1234.5);
  });

  it("given a product unit price input, when a price is typed, then the input is right-aligned but its value stays the raw editable number (decision D5)", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar producto/i }));
    const priceInput = screen.getByLabelText("Precio unitario");
    await user.type(priceInput, "1234.5");

    expect(getComputedStyle(priceInput).textAlign).toBe("right");
    expect(priceInput).toHaveValue(1234.5);
  });

  it("given catalog services, when the service dropdown opens, then the option price shows the shared 2-decimal format with a single symbol", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar servicio/i }));
    // Typing opens the freeSolo popup in jsdom (a bare click does not) and the
    // debounced search populates the options.
    await user.type(screen.getByLabelText("Nombre del servicio"), "Oil");

    // 1234.5 must render as the shared "$ 1.234,50" (exactly 2 decimals, one "$"),
    // not the old inline "$1234.50".
    expect(await screen.findByText(money(1234.5))).toBeInTheDocument();
  });

  it("given catalog products, when the product dropdown opens, then the option price shows the shared 2-decimal format with a single symbol", async () => {
    const user = userEvent.setup();
    render(<CannedJobFormDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /agregar producto/i }));
    await user.type(screen.getByLabelText("Nombre del producto"), "Oil");

    expect(
      await screen.findByText(`${money(1234.5)} — Stock: 7`),
    ).toBeInTheDocument();
  });
});
