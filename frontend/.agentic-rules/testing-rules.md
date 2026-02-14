# Testing Rules

## Naming Convention: Given-When-Then (BDD)

Use descriptive `it()` blocks following Given-When-Then:

```
it("given empty name, when submitting form, then shows validation error")
it("given valid client, when clicking edit, then navigates to edit page")
it("given API error, when loading clients, then shows error message")
```

## Tools

- Vitest + React Testing Library.
- Prefer `userEvent` over `fireEvent` for simulating user interactions.

## What to Test

**Test logic, not layout.** Focus on:
- Utility functions
- Custom hooks
- Components with business logic (calculations, conditional rendering, form validation)

**Do NOT test:**
- Pure presentational components that just render props
- MUI component internals
- Styling/layout details

## File Location

Test files live next to the code they test: `ClientList.test.tsx` next to `ClientList.tsx`.

## Example

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientForm } from "./ClientForm";

describe("ClientForm", () => {
  it("given empty name, when submitting form, then shows validation error", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ClientForm onSubmit={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: /save/i }));

    // Assert
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it("given valid data, when submitting form, then calls onSubmit with form values", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClientForm onSubmit={handleSubmit} />);

    // Act
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.click(screen.getByRole("button", { name: /save/i }));

    // Assert
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "John", lastName: "Doe" })
    );
  });
});
```

## Utility Function Test Example

```ts
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("given a number, when formatting, then returns currency string", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("given zero, when formatting, then returns $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});
```
