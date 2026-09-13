import { Box, Stack } from "@mui/material";

import type { ReactNode } from "react";

interface PageToolbarProps {
  filters?: ReactNode;
  actions?: ReactNode;
}

export function PageToolbar({ filters, actions }: PageToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      justifyContent={filters ? "space-between" : "flex-end"}
      alignItems={{ xs: "stretch", lg: "center" }}
      spacing={2}
      sx={{ mb: 2.5 }}
    >
      {filters && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {filters}
        </Box>
      )}
      {actions && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            justifyContent: { xs: "flex-start", lg: "flex-end" },
            flexShrink: 0,
          }}
        >
          {actions}
        </Box>
      )}
    </Stack>
  );
}
