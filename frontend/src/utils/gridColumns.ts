import { createElement } from "react";

import type { GridColDef } from "@mui/x-data-grid";

import { MonoText } from "@/components/MonoText";
import { formatCurrency } from "@/utils/formatCurrency";

export interface MoneyColumnOptions {
  /** Row field holding the monetary value. */
  field: string;
  /** Column header label. */
  headerName: string;
  /**
   * Extra column configuration merged UNDER the money defaults: layout only
   * (width, flex, minWidth...). The money invariants always win, so a caller
   * cannot silently defeat the right-aligned currency rendering.
   */
  overrides?: Partial<GridColDef>;
}

/**
 * Builds a MUI X DataGrid column for a monetary field.
 *
 * Cells render with the shared es-AR currency formatter (`formatCurrency`) and
 * are right-aligned by an explicit full-width block, so alignment does not
 * depend on the grid's own CSS. Non-numeric values fall back to an em dash.
 *
 * `overrides` is spread FIRST, so it can adjust layout but never replace the
 * money invariants (type, align, headerAlign, renderCell). Use a plain column
 * if a field needs a different renderer.
 */
export function moneyColumn({
  field,
  headerName,
  overrides,
}: MoneyColumnOptions): GridColDef {
  return {
    ...overrides,
    field,
    headerName,
    type: "number",
    align: "right",
    headerAlign: "right",
    renderCell: (params) => {
      const value: unknown = params.value;
      return createElement(MonoText, {
        sx: { display: "block", width: "100%", textAlign: "right" },
        children: typeof value === "number" ? formatCurrency(value) : "—",
      });
    },
  };
}
