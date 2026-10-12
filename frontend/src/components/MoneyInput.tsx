import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";

import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import {
  CURRENCY_SYMBOL,
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/utils/formatCurrency";

/**
 * Which of the two money-field layouts a MoneyInput renders (decision D16):
 *
 * - "prefix" (the default): the symbol is a fixed, non-deletable prefix INSIDE
 *   the input text, in both states, with caret handling. Used by the narrow
 *   item-table price inputs (estimates and invoices ServicesGrid/ProductsGrid),
 *   where an adornment pinned to the left edge would detach the symbol from the
 *   right-aligned digits inside the cell.
 *
 * - "adornment": the symbol renders as a startAdornment pinned to the left edge
 *   of the field, always visible in both states, and the input text carries
 *   only the amount. No prefix and no caret logic ever runs: the symbol cannot
 *   be deleted and the caret needs no surgery.
 */
export type MoneyInputLayout = "prefix" | "adornment";

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
  /** Which layout the symbol is rendered in; defaults to "prefix". */
  layout?: MoneyInputLayout;
}

/**
 * Re-exported so tests and call sites can assert against the exact same
 * string; the constant itself lives with the single shared formatter.
 */
export { CURRENCY_SYMBOL };

const DRAFT_PATTERN = /^\d*([.,]\d*)?$/;

// Clipboard text is read with es-AR rules: dot groups are thousands, comma is
// the decimal separator. These patterns decide how a pasted amount is read.
const DOT_THOUSANDS_WITH_COMMA = /^\d{1,3}(\.\d{3})+(,\d*)?$/;
const PLAIN_COMMA = /^\d+(,\d*)?$/;
const PLAIN_DOT = /^\d+(\.\d*)?$/;

function parseDraft(raw: string): number | null {
  const normalized = raw.replace(",", ".");
  if (normalized === "" || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Normalizes a pasted amount so the app's own formatted output ("$ 1.234,50",
 * copied from an invoice or a supplier list) is not silently rejected:
 *  - any currency symbol, non-breaking space and ordinary space is stripped;
 *  - dot thousands groups with an optional comma decimal ("1.234,50",
 *    "1.234,") are read as 1234.5 and 1234 respectively;
 *  - a single comma ("1234,50") is read as the decimal separator;
 *  - a single dot with no comma ("1234.50") keeps being read as the decimal
 *    separator, because that is what typing already accepts;
 *  - anything else is returned as-is and is rejected by the draft pattern.
 */
function normalizeClipboardText(raw: string): string {
  const withoutSymbols = CURRENCY_SYMBOL
    ? raw.split(CURRENCY_SYMBOL).join("")
    : raw;
  const stripped = withoutSymbols.replace(/[\s\u00a0]/g, "");
  if (DOT_THOUSANDS_WITH_COMMA.test(stripped)) {
    return stripped.replace(/\./g, "").replace(",", ".");
  }
  if (PLAIN_COMMA.test(stripped)) {
    return stripped.replace(",", ".");
  }
  if (PLAIN_DOT.test(stripped)) {
    return stripped;
  }
  return stripped;
}

/**
 * A real paste (and user-event's `paste`) reaches React's change handler as an
 * `input` event with `inputType: "insertFromPaste"`; typing is `insertText`,
 * deletions are `deleteContent*`. Only pastes may carry formatted amounts.
 */
function isPasteEvent(event: ChangeEvent<HTMLInputElement>): boolean {
  return (
    event.nativeEvent instanceof InputEvent &&
    event.nativeEvent.inputType === "insertFromPaste"
  );
}

/**
 * Shared money input with TWO layouts (decision D16), each with TWO display
 * states. On blur the value is rounded to 2 decimals and propagated in both.
 * It renders `type="text"` with `inputMode="decimal"` because a `type="number"`
 * input cannot render a formatted value at all. Right alignment is explicit on
 * the input element itself.
 *
 * layout="prefix" (default; decision D15, which supersedes the focused-state
 * behaviour of D14): the symbol is a FIXED, NON-DELETABLE PREFIX inside the
 * input text, in both states.
 * - NOT focused: shows the shared `formatCurrency` value (symbol, thousands
 *   separators, exactly 2 decimals), or an empty string when the value is null.
 * - Focused: shows the symbol followed by the plain number being typed — no
 *   thousands separator, because a formatted string breaks typing, but the
 *   SYMBOL STAYS. If the user deletes it, it comes straight back and the caret
 *   stays after it, so the field can never be left symbol-less. Used by the
 *   narrow item-table price inputs (estimates and invoices
 *   ServicesGrid/ProductsGrid), where an adornment pinned to the left edge
 *   would detach the symbol from the right-aligned digits inside the cell.
 *
 * layout="adornment" (decision D16): the symbol renders as a startAdornment
 * pinned to the left edge of the field, always visible in both states.
 * - NOT focused: shows the symbol-less shared amount
 *   (`formatCurrencyWithoutSymbol`: thousands separators, exactly 2 decimals),
 *   or an empty string when the value is null.
 * - Focused: shows the plain number being typed.
 *   Because the symbol is not part of the input text, NO prefix or caret logic
 *   runs in this layout: the change handler never writes `input.value`, never
 *   reads the selection, and never touches the caret refs — the symbol can
 *   never be deleted and the caret needs no surgery. Used by the dialog money
 *   fields (catalog Product/Service/CannedJob forms, payment dialogs).
 *
 * Pasted clipboard text is normalized with es-AR reading rules (symbol and
 * spaces stripped, dot thousands groups, comma decimal) before being accepted
 * in BOTH layouts, so copying the app's own formatted output works; typing
 * still allows at most one decimal separator. Rejected edits restore the
 * previous value (the prefix layout also restores the caret) instead of
 * letting React's restoration park the caret at the end.
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
  layout = "prefix",
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  // Only the prefix layout performs caret surgery; the adornment layout never
  // assigns pendingCaret, so the effect below never fires for it.
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaret = useRef<number | null>(null);

  // The caret must be placed AFTER React commits the value it belongs to;
  // placing it synchronously inside onChange would be overwritten by the
  // controlled update.
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        pendingCaret.current,
        pendingCaret.current,
      );
      pendingCaret.current = null;
    }
  });

  const handleFocus = () => {
    const draftValue = value === null ? "" : String(value);
    setDraft(draftValue);
    setFocused(true);
    // Adornment layout: no fixed symbol inside the text, so the caret needs no
    // surgery — it simply lands where the user clicked or tabbed in.
    if (layout === "adornment") return;
    // Prefix layout: clicking or tabbing in lands the caret after the digits,
    // never inside or before the fixed symbol prefix.
    pendingCaret.current = CURRENCY_SYMBOL.length + draftValue.length;
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    const parsed = parseDraft(draft);
    onChange(parsed === null ? null : Math.round(parsed * 100) / 100);
  };

  /**
   * ADORNMENT layout (D16): the symbol never lives in the input text, so this
   * handler performs NO symbol repair and NO caret handling — it never writes
   * `input.value`, never reads `selectionStart` and never touches
   * `pendingCaret`. The symbol in the adornment cannot be deleted.
   */
  const handleAdornmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    let digits = event.currentTarget.value;

    // While TYPING the pattern stays strict — a single separator is all it
    // allows — but a PASTE of a formatted amount ("$ 1.234,50") can never
    // match it, so pasted text is normalized with es-AR reading rules instead
    // of being silently dropped. A rejected edit just returns: the controlled
    // value restores the previous text.
    if (!DRAFT_PATTERN.test(digits)) {
      if (!isPasteEvent(event)) return;
      digits = normalizeClipboardText(digits);
      if (!DRAFT_PATTERN.test(digits)) return;
    }

    setDraft(digits);
    onChange(parseDraft(digits));
  };

  /**
   * PREFIX layout (D15): the symbol is a fixed, non-deletable prefix inside
   * the input text, with caret handling that keeps it undeletable.
   */
  const handlePrefixChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const raw = input.value;
    const rawCaret = input.selectionStart ?? raw.length;

    // A rejected change must leave the field exactly as the last accepted
    // state. Merely returning is not enough: React's own restoration rewrites
    // the value, and wherever a controlled value is rewritten the caret is
    // reset to the end of the field. Restoring value and caret synchronously,
    // like the symbol repair below, keeps the caret where the rejected edit
    // began.
    const rejectChange = () => {
      const previous = CURRENCY_SYMBOL + draft;
      if (input.value === previous) return;
      const inserted = raw.length - previous.length;
      const caret = Math.min(
        Math.max(inserted > 0 ? rawCaret - inserted : rawCaret, CURRENCY_SYMBOL.length),
        previous.length,
      );
      input.value = previous;
      input.setSelectionRange(caret, caret);
      pendingCaret.current = caret;
    };

    const startsWithSymbol = raw.startsWith(CURRENCY_SYMBOL);
    let digits = startsWithSymbol ? raw.slice(CURRENCY_SYMBOL.length) : raw;
    let pastedNormalized = false;

    // Accept digits and at most one decimal separator (comma or dot); anything
    // else is rejected outright so an unparseable value never reaches the
    // state. While TYPING the pattern stays strict — a single separator is all
    // it allows — but a PASTE of a formatted amount ("$ 1.234,50") can never
    // match it, so pasted text is normalized with es-AR reading rules instead
    // of being silently dropped.
    if (!DRAFT_PATTERN.test(digits)) {
      if (!isPasteEvent(event)) {
        rejectChange();
        return;
      }
      digits = normalizeClipboardText(digits);
      pastedNormalized = true;
      if (!DRAFT_PATTERN.test(digits)) {
        rejectChange();
        return;
      }
    }

    if (startsWithSymbol) {
      setDraft(digits);
      // A normalized paste rewrote the text to a different length: park the
      // caret at the end of the normalized value. Otherwise keep the browser's
      // caret, which sits just after the inserted text.
      pendingCaret.current = pastedNormalized
        ? CURRENCY_SYMBOL.length + digits.length
        : rawCaret;
      onChange(parseDraft(digits));
      return;
    }

    // The symbol is missing: the user deleted into it or replaced a selection
    // that included it. Keep the digits, put the symbol straight back and leave
    // the caret right after it — the field must never be left symbol-less.
    const caret = Math.min(
      Math.max(rawCaret + CURRENCY_SYMBOL.length, CURRENCY_SYMBOL.length),
      CURRENCY_SYMBOL.length + digits.length,
    );
    // Fix the DOM synchronously. When the digits did not change React skips the
    // re-render and performs its own controlled restoration — and in a real
    // browser the controlled-value change resets the caret to the END of the
    // field, so the practical benefit of writing the value here is preserving a
    // MID-STRING caret. (That React's restore would place the caret in front of
    // the restored symbol is a jsdom-only observation; do not rely on it.)
    input.value = CURRENCY_SYMBOL + digits;
    input.setSelectionRange(caret, caret);
    pendingCaret.current = caret;
    setDraft(digits);
    onChange(parseDraft(digits));
  };

  const adornment =
    layout === "adornment" ? (
      <InputAdornment position="start">{CURRENCY_SYMBOL}</InputAdornment>
    ) : undefined;

  return (
    <TextField
      type="text"
      label={label}
      value={
        layout === "adornment"
          ? focused
            ? draft
            : value === null
              ? ""
              : formatCurrencyWithoutSymbol(value)
          : focused
            ? CURRENCY_SYMBOL + draft
            : value === null
              ? ""
              : formatCurrency(value)
      }
      onChange={layout === "adornment" ? handleAdornmentChange : handlePrefixChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      error={error}
      helperText={helperText}
      required={required}
      fullWidth={fullWidth}
      disabled={disabled}
      size={size}
      placeholder={placeholder}
      inputRef={inputRef}
      slotProps={{
        htmlInput: {
          // Decision D4: right alignment is explicit on the input element,
          // never delegated to flex positioning.
          style: { textAlign: "right" },
          inputMode: "decimal",
          ...(testId ? { "data-testid": testId } : {}),
        },
        ...(adornment ? { input: { startAdornment: adornment } } : {}),
      }}
    />
  );
}
