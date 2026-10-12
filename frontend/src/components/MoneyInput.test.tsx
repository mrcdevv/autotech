import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { CURRENCY_SYMBOL, MoneyInput, type MoneyInputLayout } from "./MoneyInput";
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/utils/formatCurrency";

interface HarnessProps {
  initial: number | null;
  onChange: (value: number | null) => void;
  layout?: MoneyInputLayout;
}

function Harness({ initial, onChange, layout = "prefix" }: HarnessProps) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <MoneyInput
      label="Monto"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      layout={layout}
      testId="money-input"
    />
  );
}

describe("MoneyInput", () => {
  it("given a value, when the field is not focused, then it shows the shared 2-decimal es-AR currency string", () => {
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    // toHaveValue compares verbatim (no normalization): proves exactly 2 decimals,
    // thousands separators and a single "$" symbol, with the U+00A0 the helper emits.
    expect(input).toHaveValue(formatCurrency(1234.5));
  });

  it("given a value, then the symbol is visible in BOTH states (decision D15)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    // Not focused: the shared formatter output starts with the symbol...
    expect(formatCurrency(1234.5).startsWith(CURRENCY_SYMBOL)).toBe(true);
    // ...and focused it STAYS, now followed by the plain number.
    await user.click(input);
    expect(input).toHaveValue(CURRENCY_SYMBOL + "1234.5");
  });

  it("given a null value, when the field is not focused, then it shows an empty string", () => {
    render(<Harness initial={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Monto")).toHaveValue("");
  });

  it("given the field is focused, then it shows the symbol followed by the plain number being typed (decision D15)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);

    // D15: while focused only the thousands separator and decimal separator are
    // dropped — the SYMBOL STAYS, adjacent to the digits being typed.
    expect(input).toHaveValue(CURRENCY_SYMBOL + "1234.5");
  });

  it("given typing with a dot, then it propagates the parsed number", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "50.25");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "50.25");
    expect(onChange).toHaveBeenLastCalledWith(50.25);
  });

  it("given typing with a comma, then it accepts the comma as a decimal separator", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "50,25");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "50,25");
    expect(onChange).toHaveBeenLastCalledWith(50.25);
  });

  it("given the symbol is deleted, then it comes straight back and the caret stays after it (decision D15)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={42} onChange={onChange} />);

    const input = screen.getByLabelText<HTMLInputElement>("Monto");
    await user.click(input);
    expect(input).toHaveValue(CURRENCY_SYMBOL + "42");

    // One backspace deletes a digit (caret sits at the end after focusing)...
    await user.type(input, "{backspace}");
    expect(input).toHaveValue(CURRENCY_SYMBOL + "4");

    // ...further backspaces delete INTO the symbol: the symbol comes straight
    // back and the caret stays right after it, never in front of it.
    await user.type(input, "{backspace}{backspace}{backspace}");
    expect(input).toHaveValue(CURRENCY_SYMBOL);
    expect(input.selectionStart).toBe(CURRENCY_SYMBOL.length);
    expect(input.selectionEnd).toBe(CURRENCY_SYMBOL.length);

    // Even a full clear cannot leave the field without the symbol.
    await user.clear(input);
    expect(input).toHaveValue(CURRENCY_SYMBOL);
    expect(input.selectionStart).toBe(CURRENCY_SYMBOL.length);
  });

  it("given the focused field is fully selected, then typing replaces the digits and keeps the symbol (decision D15)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={1234.5} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    // The selection covers symbol and digits; what gets replaced is the NUMBER,
    // never the symbol. (Ctrl+A is how userEvent v14 performs a select-all.)
    await user.type(input, "{Control>}a{/Control}99");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "99");
    expect(onChange).toHaveBeenLastCalledWith(99);
  });

  it("given the field is emptied, then it propagates null and the symbol stays (decision D15)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={42} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.clear(input);

    // D15: the symbol is a fixed, non-deletable prefix — the digits may be
    // emptied but the field can never be left symbol-less.
    expect(input).toHaveValue(CURRENCY_SYMBOL);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("given a longer fraction, when the field loses focus, then the value is rounded to 2 decimals and shown formatted", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "10.567");
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(10.57);
    // toHaveValue compares verbatim (no normalization): proves exactly 2 decimals
    // and a single "$" symbol, with the U+00A0 the helper emits.
    expect(input).toHaveValue(formatCurrency(10.57));
  });

  it("given an unparseable entry, then it propagates null and never yields NaN", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    // A lone separator is unparseable and propagates null, never NaN.
    await user.type(input, ",");
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue(CURRENCY_SYMBOL + ",");

    // Letters are rejected outright: the value does not change.
    await user.type(input, "abc");
    expect(input).toHaveValue(CURRENCY_SYMBOL + ",");

    for (const call of onChange.mock.calls) {
      expect(call[0]).not.toBeNaN();
    }
  });

  it("given pasting the app's own formatted output, then the paste is normalized to the expected number instead of silently dropped", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    // The clipboard content is exactly what the app itself displays: symbol,
    // NBSP, dot thousands groups and a comma decimal (e.g. copied from an
    // invoice or a supplier list).
    await user.paste(formatCurrency(1234.5));

    expect(input).toHaveValue(CURRENCY_SYMBOL + "1234.50");
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
  });

  it("given pasting a thousands-grouped amount without the symbol, then es-AR rules read the dot groups as thousands", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.paste("12.345,6");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "12345.6");
    expect(onChange).toHaveBeenLastCalledWith(12345.6);
  });

  it("given an invalid paste, then the field keeps its previous value and propagates nothing new", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "50");
    expect(onChange).toHaveBeenLastCalledWith(50);

    // Two commas and two dots can never be an es-AR amount: the paste is
    // rejected and no stray value reaches the field or the parent state.
    await user.paste("1,2.3.4");
    expect(input).toHaveValue(CURRENCY_SYMBOL + "50");
    expect(onChange).toHaveBeenLastCalledWith(50);
  });

  it("given the caret is mid-string with digits present, then typing a digit inserts at the caret and the caret follows it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={50} onChange={onChange} />);

    const input = screen.getByLabelText<HTMLInputElement>("Monto");
    await user.click(input);
    expect(input).toHaveValue(CURRENCY_SYMBOL + "50");

    // Move the caret between the "5" and the "0" with the arrow keys the way a
    // real user would, then type — one user.type call, because user-event only
    // tracks its UI caret within a single API call.
    await user.type(input, "{ArrowLeft}5");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "550");
    expect(input.selectionStart).toBe(CURRENCY_SYMBOL.length + 2);
    expect(input.selectionEnd).toBe(CURRENCY_SYMBOL.length + 2);
    expect(onChange).toHaveBeenLastCalledWith(550);
  });

  it("given a rejected keystroke typed mid-string, then the caret does not silently jump to the end", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={50} onChange={onChange} />);

    const input = screen.getByLabelText<HTMLInputElement>("Monto");
    await user.click(input);
    // Move the caret between the "5" and the "0" like a real user, then type a
    // letter (single user.type call — see the mid-string typing test above).
    await user.type(input, "{ArrowLeft}a");

    // The letter is rejected: the value is untouched AND the caret stays where
    // the rejected edit began instead of being reset to the end of the field.
    expect(input).toHaveValue(CURRENCY_SYMBOL + "50");
    expect(input.selectionStart).toBe(CURRENCY_SYMBOL.length + 1);
    expect(input.selectionEnd).toBe(CURRENCY_SYMBOL.length + 1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("given typing a second separator, then it is still rejected while typing stays strict — normalization never applies to keystrokes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    // The comma keystroke ("1.234" + ",") would be a second separator: it is
    // rejected, unlike an equivalent PASTE of "1.234,50" which is normalized.
    // The digits keep the dot-as-decimal reading typing already had.
    await user.type(input, "1.234,5");

    expect(input).toHaveValue(CURRENCY_SYMBOL + "1.2345");
    expect(onChange).toHaveBeenLastCalledWith(1.2345);
  });

  it("given the component contract, then the input is type text with inputMode decimal and explicitly right-aligned", () => {
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
    // Decision D4/D13: positive inline-style assertion (jsdom reflects inline styles
    // in getComputedStyle); never a vacuous negative computed-style check.
    expect(getComputedStyle(input).textAlign).toBe("right");
  });

  it("given the component contract, then the symbol is part of the input text, not an adornment (decision D15)", () => {
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    // The symbol must stay adjacent to the right-aligned digits, so it lives in
    // the input value itself: the raw value carries the symbol in both states.
    expect(input).toHaveValue(formatCurrency(1234.5));
    // No adornment element wraps the field: the label's control is a bare input.
    expect(input.closest(".MuiInputAdornment-root")).toBeNull();
  });

  it("given a testId, then it lands on the input element as data-testid", () => {
    render(<Harness initial={null} onChange={vi.fn()} />);

    expect(screen.getByTestId("money-input")).toBe(screen.getByLabelText("Monto"));
  });

  describe('layout="adornment" (decision D16)', () => {
    function getAdornment(input: HTMLElement): Element | null {
      return (
        input
          .closest(".MuiInputBase-root")
          ?.querySelector(".MuiInputAdornment-root") ?? null
      );
    }

    it("given a value, when not focused, then the input shows the symbol-less shared 2-decimal amount while the adornment carries the symbol", () => {
      render(<Harness initial={1234.5} onChange={vi.fn()} layout="adornment" />);

      const input = screen.getByLabelText<HTMLInputElement>("Monto");
      // Exact raw-value match: 2 decimals, thousands grouping, NO symbol — the
      // adornment carries the symbol instead of the input text.
      expect(input).toHaveValue(formatCurrencyWithoutSymbol(1234.5));
      expect(input.value).not.toContain(CURRENCY_SYMBOL);
      // The symbol is visible in the startAdornment pinned to the left edge.
      const adornment = getAdornment(input);
      expect(adornment).not.toBeNull();
      expect(adornment).toHaveTextContent(CURRENCY_SYMBOL);
      expect(getComputedStyle(input).textAlign).toBe("right");
    });

    it("given the field is focused, then the input shows the plain number being typed while the adornment still carries the symbol", async () => {
      const user = userEvent.setup();
      render(<Harness initial={1234.5} onChange={vi.fn()} layout="adornment" />);

      const input = screen.getByLabelText<HTMLInputElement>("Monto");
      await user.click(input);

      expect(input).toHaveValue("1234.5");
      expect(input.value).not.toContain(CURRENCY_SYMBOL);
      expect(getAdornment(input)).toHaveTextContent(CURRENCY_SYMBOL);
    });

    it("given typing a comma, then it is accepted as the decimal separator and no symbol enters the text", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial={null} onChange={onChange} layout="adornment" />);

      const input = screen.getByLabelText<HTMLInputElement>("Monto");
      await user.click(input);
      await user.type(input, "50,25");

      expect(input).toHaveValue("50,25");
      expect(input.value).not.toContain(CURRENCY_SYMBOL);
      expect(onChange).toHaveBeenLastCalledWith(50.25);
    });

    it("given a longer fraction, when the field loses focus, then the value is rounded to 2 decimals and shown symbol-less", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial={null} onChange={onChange} layout="adornment" />);

      const input = screen.getByLabelText("Monto");
      await user.click(input);
      await user.type(input, "10.567");
      await user.tab();

      expect(onChange).toHaveBeenLastCalledWith(10.57);
      expect(input).toHaveValue(formatCurrencyWithoutSymbol(10.57));
    });

    it("given the field is emptied, then it propagates null and the symbol does NOT re-enter the text — no prefix repair runs in the adornment layout", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial={42} onChange={onChange} layout="adornment" />);

      const input = screen.getByLabelText<HTMLInputElement>("Monto");
      await user.click(input);
      await user.clear(input);

      expect(input).toHaveValue("");
      expect(input.value).not.toContain(CURRENCY_SYMBOL);
      expect(onChange).toHaveBeenLastCalledWith(null);
      // The symbol remains visible in the adornment in BOTH states.
      expect(getAdornment(input)).toHaveTextContent(CURRENCY_SYMBOL);
    });

    it("given pasting the app's own formatted output, then the paste is normalized in the adornment layout too", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial={null} onChange={onChange} layout="adornment" />);

      const input = screen.getByLabelText<HTMLInputElement>("Monto");
      await user.click(input);
      // The clipboard content is exactly what the app itself displays: symbol,
      // NBSP, dot thousands groups and a comma decimal (e.g. copied from an
      // invoice or a supplier list).
      await user.paste(formatCurrency(1234.5));

      expect(input).toHaveValue("1234.50");
      expect(input.value).not.toContain(CURRENCY_SYMBOL);
      expect(onChange).toHaveBeenLastCalledWith(1234.5);
    });
  });
});
