import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DebtAgingTable } from "./DebtAgingTable";

describe("DebtAgingTable", () => {
  it("given data, when rendered, then shows all four ranges", () => {
    const data = [
      { range: "0-30", deliveryNoteCount: 3, totalAmount: 9000 },
      { range: "31-60", deliveryNoteCount: 1, totalAmount: 3000 },
      { range: "61-90", deliveryNoteCount: 0, totalAmount: 0 },
      { range: "90+", deliveryNoteCount: 1, totalAmount: 2000 },
    ];

    render(<DebtAgingTable data={data} />);

    expect(screen.getByText("0-30")).toBeInTheDocument();
    expect(screen.getByText("31-60")).toBeInTheDocument();
    expect(screen.getByText("61-90")).toBeInTheDocument();
    expect(screen.getByText("90+")).toBeInTheDocument();
    expect(screen.getByText("Antigüedad de deuda")).toBeInTheDocument();
  });
});
