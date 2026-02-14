# Component Rules

## Fundamentals

1. Use functional components only. No class components.
2. Use MUI components for all UI elements. Never use raw HTML when MUI provides an equivalent (`Button`, `TextField`, `Typography`, `Box`, `Stack`, `Grid`, `Paper`, etc.).
3. Component files use PascalCase: `ClientList.tsx`, `RepairOrderCard.tsx`.
4. One component per file (plus small tightly-coupled helper components if needed).
5. Export components as **named exports** (except page-level components and `App.tsx` which use default export).
6. Props interfaces must be defined explicitly and colocated above the component.

## Component Structure

Follow this order inside a component file:

```tsx
// 1. Imports (React/libs, MUI, project, types)
// 2. Props interface
// 3. Component function
// 4. Helper sub-components (if any, small and tightly coupled)
```

## Custom Hooks

Extract stateful logic into custom hooks when:
- The logic is reused by multiple components.
- The component has complex state management (multiple `useState`/`useEffect`).
- You want to keep the component focused on rendering.

Hooks live in `src/hooks/` if shared, or in the feature folder if feature-specific.

```tsx
// src/features/clients/useClients.ts
export function useClients() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientsApi.getAll()
      .then((res) => setClients(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { clients, loading, error };
}

// src/features/clients/ClientList.tsx
export function ClientList() {
  const { clients, loading, error } = useClients();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (clients.length === 0) return <Typography>No clients found.</Typography>;

  return (/* render list */);
}
```

## Example

```tsx
import { Card, CardContent, CardActions, Typography, Button } from "@mui/material";

interface RepairOrderCardProps {
  order: RepairOrderResponse;
  onEdit: (id: number) => void;
}

export function RepairOrderCard({ order, onEdit }: RepairOrderCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{order.title}</Typography>
        <Typography color="text.secondary">
          Status: {order.status}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onEdit(order.id)}>
          Edit
        </Button>
      </CardActions>
    </Card>
  );
}
```
