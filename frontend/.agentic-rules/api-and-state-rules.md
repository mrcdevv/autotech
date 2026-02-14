# API Layer Rules

## Axios Instance

All HTTP requests go through the shared Axios instance in `src/api/client.ts`. Never import `axios` directly in components or hooks.

## API Files

Create one file per resource in `src/api/`:

```
src/api/
├── client.ts          # Axios instance (shared)
├── clients.ts         # Client API functions
├── vehicles.ts        # Vehicle API functions
├── repairOrders.ts    # Repair order API functions
└── ...
```

## API Function Pattern

Each API function is typed and returns a promise:

```tsx
import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { ClientResponse, ClientRequest } from "@/types/client";

export const clientsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<ClientResponse[]>>("/clients"),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ClientResponse>>(`/clients/${id}`),

  create: (data: ClientRequest) =>
    apiClient.post<ApiResponse<ClientResponse>>("/clients", data),

  update: (id: number, data: ClientRequest) =>
    apiClient.put<ApiResponse<ClientResponse>>(`/clients/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/clients/${id}`),
};
```

# State Management Rules

## Keep It Simple

1. Start with React's built-in state: `useState`, `useReducer`, `useContext`.
2. Do NOT add a state management library (Redux, Zustand, etc.) unless complexity genuinely demands it.
3. Lift state up to the nearest common parent.
4. Use Context only for truly global state (auth, theme).
5. Encapsulate complex stateful logic in custom hooks (e.g., `useRepairOrders()`).

## Data Fetching Pattern

Use custom hooks that handle loading, error, and data states:

```tsx
export function useClient(id: number) {
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientsApi.getById(id)
      .then((res) => setClient(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { client, loading, error };
}
```

# Routing Rules

1. Route definitions live in `src/routes/`.
2. Use lazy loading (`React.lazy`) for page-level components.
3. Route paths must be kebab-case: `/repair-orders`, `/repair-orders/:id`.
