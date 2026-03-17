import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PaymentsTabPlaceholder } from "./PaymentsTabPlaceholder";

describe("PaymentsTabPlaceholder", () => {
  it("given invoiceId, when rendered, then shows placeholder text", () => {
    render(<PaymentsTabPlaceholder invoiceId={1} />);

    expect(screen.getByText("Pagos — Próximamente")).toBeInTheDocument();
    expect(screen.getByText(/gestión de pagos/)).toBeInTheDocument();
  });
});
