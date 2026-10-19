import { describe, it, expect } from "vitest";

import {
  CURRENCY_SYMBOL,
  formatCurrency,
  formatCurrencyWithoutSymbol,
  formatCurrencyWhole,
} from "./formatCurrency";

// Contract test: expectations are written as explicit literals/regexes on the expected
// digits. They are deliberately NOT derived by calling the helpers, so a regression in
// the helper output is caught instead of silently re-asserting the new behaviour.
// Known quirk of Intl es-AR: the currency output contains a NON-BREAKING SPACE (U+00A0)
// between the "$" symbol and the number.

describe("formatCurrency contract", () => {
  it("renders exactly 2 decimals with es-AR grouping and separators", () => {
    expect(formatCurrency(1234.5)).toMatch(/^\$\u00A01\.234,50$/);
  });

  it('uses "." as thousands separator and "," as decimal separator', () => {
    expect(formatCurrency(1234567.89)).toMatch(/^\$\u00A01\.234\.567,89$/);
    expect(formatCurrency(226.8)).toMatch(/^\$\u00A0226,80$/);
  });

  it("contains the currency symbol $", () => {
    expect(formatCurrency(1234.5)).toContain("$");
  });

  it("contains a non-breaking space (U+00A0) after the symbol", () => {
    expect(formatCurrency(1234.5)).toContain("\u00A0");
  });

  it("renders zero with exactly 2 decimals", () => {
    expect(formatCurrency(0)).toMatch(/^\$\u00A00,00$/);
  });
});

// Contract for the symbol-less amount used by MoneyInput's "adornment" layout
// (decision D16): it must be DERIVED from formatCurrency — the single es-AR
// source — never a second implementation of the grouping rules.
describe("formatCurrencyWithoutSymbol contract", () => {
  it("is derived from formatCurrency: removing the symbol and its spacing yields exactly the symbol-less amount", () => {
    for (const value of [0, 42, 226.8, 1234.5, 1234567.89]) {
      expect(formatCurrencyWithoutSymbol(value)).toBe(
        formatCurrency(value)
          .replace(CURRENCY_SYMBOL, "")
          .replace(/^[\s\u00a0]+/, ""),
      );
    }
  });

  it("pins the es-AR output for zero, a plain value and a value with thousands", () => {
    expect(formatCurrencyWithoutSymbol(0)).toMatch(/^0,00$/);
    expect(formatCurrencyWithoutSymbol(1234.5)).toMatch(/^1\.234,50$/);
    expect(formatCurrencyWithoutSymbol(1234567.89)).toMatch(/^1\.234\.567,89$/);
  });

  it("never contains the currency symbol", () => {
    for (const value of [0, 1234.5, 1234567.89]) {
      expect(formatCurrencyWithoutSymbol(value)).not.toContain(CURRENCY_SYMBOL);
    }
  });
});

describe("formatCurrencyWhole contract", () => {
  it("renders 0 decimals with es-AR grouping", () => {
    // ECMA-402 default rounding is half-expand, so 1234.5 rounds UP to 1.235 at
    // 0 fraction digits. This pins that documented behaviour explicitly.
    expect(formatCurrencyWhole(1234.5)).toMatch(/^\$\u00A01\.235$/);
    expect(formatCurrencyWhole(1234)).toMatch(/^\$\u00A01\.234$/);
  });
});
