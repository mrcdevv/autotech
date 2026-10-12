import { render, screen } from "@testing-library/react";
import { DataGrid } from "@mui/x-data-grid";
import { describe, it, expect } from "vitest";

import { moneyColumn } from "./gridColumns";

describe("moneyColumn", () => {
  it("given defaults, when built, then reports right alignment for cell and header", () => {
    const column = moneyColumn({ field: "total", headerName: "Total" });

    expect(column.align).toBe("right");
    expect(column.headerAlign).toBe("right");
  });

  it("given overrides, when built, then merges them over the money defaults", () => {
    const column = moneyColumn({
      field: "total",
      headerName: "Total",
      overrides: { flex: 0.75, minWidth: 120 },
    });

    expect(column.flex).toBe(0.75);
    expect(column.minWidth).toBe(120);
    expect(column.field).toBe("total");
    expect(column.headerName).toBe("Total");
  });

  it("given overrides that fight the alignment, when built, then the money invariants win", () => {
    const column = moneyColumn({
      field: "total",
      headerName: "Total",
      overrides: { align: "left", headerAlign: "left" },
    });

    expect(column.align).toBe("right");
    expect(column.headerAlign).toBe("right");
  });

  it("given an override renderCell, when rendered, then the money renderer still wins", () => {
    const column = moneyColumn({
      field: "total",
      headerName: "Total",
      overrides: { renderCell: () => "OVERRIDDEN" },
    });
    render(
      <div style={{ width: 400, height: 300 }}>
        <DataGrid
          rows={[{ id: 1, total: 1234.5 }]}
          columns={[column]}
          autoHeight
          hideFooter
        />
      </div>,
    );

    expect(screen.queryByText("OVERRIDDEN")).toBeNull();
    const cells = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.textContent === "$\u00A01.234,50");
    expect(cells).toHaveLength(1);
  });

  it("given a value, when rendered, then shows the currency symbol with exactly 2 decimals", () => {
    const column = moneyColumn({ field: "total", headerName: "Total" });
    render(
      <div style={{ width: 400, height: 300 }}>
        <DataGrid
          rows={[{ id: 1, total: 1234.5 }]}
          columns={[column]}
          autoHeight
          hideFooter
        />
      </div>,
    );

    // Hardcoded expected es-AR output: thousands "." / decimals "," / NBSP after symbol.
    const cells = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.textContent === "$\u00A01.234,50");
    expect(cells).toHaveLength(1);
  });

  it("given a value, when rendered, then keeps the NBSP after the currency symbol", () => {
    const column = moneyColumn({ field: "total", headerName: "Total" });
    render(
      <div style={{ width: 400, height: 300 }}>
        <DataGrid
          rows={[{ id: 1, total: 1234.5 }]}
          columns={[column]}
          autoHeight
          hideFooter
        />
      </div>,
    );

    const cells = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.textContent === "$\u00A01.234,50");
    expect(cells).toHaveLength(1);
    const text = cells[0]?.textContent ?? "";
    expect(text).toContain("$");
    expect(text).toContain(",");
    expect(text).toContain(".");
    // Explicit non-breaking space (U+00A0) between "$" and the amount.
    expect(text).toContain("\u00A0");
  });

  it("given a null or undefined value, when rendered, then shows the em dash placeholder", () => {
    const column = moneyColumn({ field: "total", headerName: "Total" });
    render(
      <div style={{ width: 400, height: 300 }}>
        <DataGrid
          rows={[
            { id: 1, total: null },
            { id: 2, total: undefined },
          ]}
          columns={[column]}
          autoHeight
          hideFooter
        />
      </div>,
    );

    const cells = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.textContent === "—");
    expect(cells).toHaveLength(2);
  });
});
