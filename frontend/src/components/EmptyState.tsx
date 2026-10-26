import type { ReactNode } from "react";

import { Box, Paper, Typography } from "@mui/material";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Action area rendered below the description (e.g. a Button, or a disabled Button wrapped in a Tooltip). */
  children?: ReactNode;
}

// Shared empty state for the repair-order tabs (Factura, Presupuesto, Inspecciones).
// Centralizes the visual shape so the three tabs cannot drift apart again: bordered
// centred container, 48px icon, h6 title, constrained secondary description, and an
// optional action area below.
export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "center",
          // MUI icons size themselves via their own class; force the shared 48px size here.
          "& .MuiSvgIcon-root": { fontSize: 48 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
        {description}
      </Typography>
      {children && <Box sx={{ mt: 3 }}>{children}</Box>}
    </Paper>
  );
}
