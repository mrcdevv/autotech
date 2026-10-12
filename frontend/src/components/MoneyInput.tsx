import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";

import TextField from "@mui/material/TextField";

import { formatCurrency } from "@/utils/formatCurrency";

interface MoneyInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  placeholder?: string;
  testId?: string;
}

function parseDraft(raw: string): number | null {
  const normalized = raw.replace(",", ".");
  if (normalized === "" || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Shared money input with TWO display states (decision D14):
 * - NOT focused: shows the shared `formatCurrency` value (symbol, thousands
 *   separators, exactly 2 decimals), or an empty string when the value is null.
 * - Focused: shows the plain number being typed — no symbol, no thousands
 *   separator — because a formatted string breaks typing. On blur the value is
 *   rounded to 2 decimals and propagated.
 *
 * It renders `type="text"` with `inputMode="decimal"` because a `type="number"`
 * input cannot render a formatted value at all. It adds NO manual dollar
 * adornment: the formatter already emits the symbol, and an adornment would
 * double it while the field is not focused.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  fullWidth,
  disabled,
  size,
  placeholder,
  testId,
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const handleFocus = () => {
    setDraft(value === null ? "" : String(value));
    setFocused(true);
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    const parsed = parseDraft(draft);
    onChange(parsed === null ? null : Math.round(parsed * 100) / 100);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    // Accept digits and at most one decimal separator (comma or dot); anything
    // else is rejected outright so an unparseable value never reaches the state.
    if (raw !== "" && !/^\d*([.,]\d*)?$/.test(raw)) return;
    setDraft(raw);
    onChange(parseDraft(raw));
  };

  return (
    <TextField
      type="text"
      label={label}
      value={focused ? draft : value === null ? "" : formatCurrency(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      error={error}
      helperText={helperText}
      required={required}
      fullWidth={fullWidth}
      disabled={disabled}
      size={size}
      placeholder={placeholder}
      slotProps={{
        htmlInput: {
          // Decision D4: right alignment is explicit on the input element,
          // never delegated to flex positioning.
          style: { textAlign: "right" },
          inputMode: "decimal",
          ...(testId ? { "data-testid": testId } : {}),
        },
      }}
    />
  );
}
