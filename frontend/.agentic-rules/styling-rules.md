# Styling Rules

1. Always use MUI's `sx` prop or `styled()` API for styling. No inline CSS objects outside of `sx`.
2. Never use raw CSS files, CSS modules, or Tailwind.
3. Use theme values: `theme.palette.*`, `theme.spacing()`, `theme.typography.*`.
4. Use MUI's `Stack`, `Box`, and `Grid` for layout. Avoid manual flexbox in `sx` when MUI layout components suffice.

## Example

```tsx
// CORRECT: using sx with theme values
<Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
  <Typography variant="h5" sx={{ mb: 2 }}>
    Clients
  </Typography>
</Box>

// CORRECT: using Stack for layout
<Stack direction="row" spacing={2} alignItems="center">
  <TextField label="Search" />
  <Button variant="contained">Search</Button>
</Stack>

// WRONG: raw CSS
<div style={{ padding: "16px", backgroundColor: "#fff" }}>
  <h1>Clients</h1>
</div>
```

## Monetary amounts

1. One single formatter: always import `formatCurrency` from `src/utils/formatCurrency.ts`.
   Never write `toFixed`, never call `toLocaleString` directly, never prefix a manual `$`.
   In MUI DataGrids, use the shared `moneyColumn()` helper from `src/utils/gridColumns.ts`
   instead of hand-writing `align` / `renderCell` per column.
2. Exactly 2 decimals for every displayed amount. `formatCurrencyWhole` is permitted ONLY
   for chart axes and tooltips, where cents hurt readability.
3. Right alignment must be explicit (`textAlign: "right"`) and must live on a BLOCK-level
   element: a `Typography` (renders `<p>`) or a flex row. A bare
   `<MonoText sx={{ textAlign: "right" }}>` is a silent no-op: `MonoText` renders an
   inline `<span>`, where `text-align` does nothing, and the bug is invisible in tests.
   If you must align inside a `MonoText`, give it a block display as well, exactly as
   `src/utils/gridColumns.ts` does:
   `sx={{ display: "block", width: "100%", textAlign: "right" }}`. If a label and an amount share one block, restructure into
   a flex row (`Box` with `display: "flex"` and `justifyContent: "space-between"`) so only
   the amount carries the alignment.
4. Editable money fields use the shared `MoneyInput` component
   (`src/components/MoneyInput.tsx`) — never a bare `type="number"` input and never a
   manual `$` `InputAdornment`. A money input has TWO states (decision D14): while
   FOCUSED it shows the plain number being typed — no symbol, no thousands separator,
   because a formatted string breaks typing — and while NOT focused it shows the shared
   `formatCurrency` value exactly like any other amount, rounding to 2 decimals on blur.
   `type="number"` cannot render a formatted value at all, and a manual dollar adornment
   would double the symbol the formatter already emits while the field is not focused.
   Right alignment stays explicit on the input element itself.
5. Tests: an alignment assertion must target a block-level element, and a NEGATIVE
   assertion on a computed style is suspect in jsdom — `getComputedStyle(el).display`
   returns an EMPTY STRING when no author rule sets the property, so `display !== "inline"`
   passes vacuously. Assert the DOM shape (tag name, containment) instead of the absence
   of a rule; pair every computed `textAlign` check with an inline-tag guard.

```tsx
// CORRECT: alignment on the block that contains the amount
<Box display="flex" justifyContent="space-between">
  <Typography variant="body2">Total</Typography>
  <Typography variant="body2" sx={{ textAlign: "right" }}>
    <MonoText>{formatCurrency(total)}</MonoText>
  </Typography>
</Box>

// WRONG: text-align is a no-op on MonoText's inline span
<MonoText sx={{ textAlign: "right" }}>{formatCurrency(total)}</MonoText>

// WRONG: manual formatting
<Typography>${total.toFixed(2)}</Typography>
```
