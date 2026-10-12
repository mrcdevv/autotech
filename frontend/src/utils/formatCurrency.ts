export function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * The currency symbol, derived from the single shared formatter — never a manual
 * "$". MoneyInput renders it (as a prefix or an adornment, per its layout) and
 * tests assert against the exact same string.
 */
export const CURRENCY_SYMBOL = formatCurrency(0).replace(/[\d.,\s\u00a0]/g, "");

/**
 * The symbol-less amount for fields that show the currency symbol in an
 * `InputAdornment` (MoneyInput layout="adornment", decision D16): exactly the
 * `formatCurrency` output minus the symbol and its trailing spacing, so the
 * es-AR grouping rules keep living in ONE place and this can never drift from
 * the formatted amount.
 */
export function formatCurrencyWithoutSymbol(value: number): string {
  return formatCurrency(value)
    .replace(CURRENCY_SYMBOL, "")
    .replace(/^[\s\u00a0]+/, "");
}

export function formatCurrencyWhole(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
