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
