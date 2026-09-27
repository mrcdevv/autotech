import { Box, Stack } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PageShellProps {
  title: string;
  titleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ contentSx, actions, children }: PageShellProps) {
  return (
    <Box
      sx={[
        { py: 2, width: "100%", minWidth: 0 },
        ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
      ]}
    >
      {actions && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          {actions}
        </Stack>
      )}
      {children}
    </Box>
  );
}
