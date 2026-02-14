# TypeScript Rules

## Strict Mode

Strict mode is enabled. Never use `any`. Use `unknown` if the type is truly unknown, then narrow it.

## Types vs Interfaces

- Use `interface` for object shapes (props, API responses, data models).
- Use `type` for unions, intersections, and utility types.

```tsx
// interface for object shapes
interface ClientResponse {
  id: number;
  firstName: string;
  lastName: string;
  clientType: ClientType;
}

// type for unions
type ClientType = "REGISTERED" | "WALK_IN";

// type for utility
type Nullable<T> = T | null;
```

## API Response Typing

Define a generic `ApiResponse` type that matches the backend:

```tsx
interface ApiResponse<T> {
  status: "success" | "error";
  message: string | null;
  data: T;
}
```

## Files

All files must be `.ts` or `.tsx`. No `.js` files.

## Import Rules

1. Use path aliases: `import { ClientList } from "@/features/clients/ClientList"`.
2. Group imports in this order, separated by blank lines:
   - (1) React and third-party libraries
   - (2) MUI imports
   - (3) Project imports (`@/...`)
   - (4) Type-only imports

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { Box, Typography, Button } from "@mui/material";

import { useClients } from "@/features/clients/useClients";
import { ClientCard } from "@/features/clients/ClientCard";

import type { ClientResponse } from "@/types/client";
```

3. No circular imports.
