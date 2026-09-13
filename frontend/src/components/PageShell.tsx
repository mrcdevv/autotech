import { Box, Stack, Typography } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PageShellProps {
  title: string;
  titleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, titleSx, contentSx, actions, children }: PageShellProps) {
  return (
    <Box
      sx={[
        { px: { xs: 2, lg: 3 }, py: 2.5, width: "100%", minWidth: 0 },
        ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
      ]}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Typography variant="h3" sx={titleSx}>{title}</Typography>
        {actions}
      </Stack>
      {children}
    </Box>
  );
}
