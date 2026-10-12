import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { MoneyInput } from "./MoneyInput";
import { formatCurrency } from "@/utils/formatCurrency";

interface HarnessProps {
  initial: number | null;
  onChange: (value: number | null) => void;
}

function Harness({ initial, onChange }: HarnessProps) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <MoneyInput
      label="Monto"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
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

  it("given a null value, when the field is not focused, then it shows an empty string", () => {
    render(<Harness initial={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Monto")).toHaveValue("");
  });

  it("given the field is focused, then it shows the plain editable number with no symbol and no thousands separator", async () => {
    const user = userEvent.setup();
    render(<Harness initial={1234.5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);

    expect(input).toHaveValue("1234.5");
  });

  it("given typing with a dot, then it propagates the parsed number", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "50.25");

    expect(input).toHaveValue("50.25");
    expect(onChange).toHaveBeenLastCalledWith(50.25);
  });

  it("given typing with a comma, then it accepts the comma as a decimal separator", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={null} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.type(input, "50,25");

    expect(input).toHaveValue("50,25");
    expect(onChange).toHaveBeenLastCalledWith(50.25);
  });

  it("given the field is emptied, then it propagates null", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={42} onChange={onChange} />);

    const input = screen.getByLabelText("Monto");
    await user.click(input);
    await user.clear(input);

    expect(input).toHaveValue("");
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
    expect(input).toHaveValue(",");

    // Letters are rejected outright: the value does not change.
    await user.type(input, "abc");
    expect(input).toHaveValue(",");

    for (const call of onChange.mock.calls) {
      expect(call[0]).not.toBeNaN();
    }
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

  it("given a testId, then it lands on the input element as data-testid", () => {
    render(<Harness initial={null} onChange={vi.fn()} />);

    expect(screen.getByTestId("money-input")).toBe(screen.getByLabelText("Monto"));
  });
});
