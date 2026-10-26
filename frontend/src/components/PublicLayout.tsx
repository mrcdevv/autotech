import type { ReactNode } from "react";

import { Box, Paper, Typography } from "@mui/material";

import { brand, shell } from "@/theme/tokens";

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Layout for pages opened by clients from an email link (no login): same look as the emails.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 2, sm: 5 }, px: 2 }}>
      <Paper
        variant="outlined"
        sx={{ maxWidth: 600, mx: "auto", overflow: "hidden", borderRadius: 2 }}
      >
        <Box sx={{ bgcolor: shell.bg, px: { xs: 3, sm: 4 }, py: 2.5, display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: "4px", bgcolor: brand.accent }} />
          <Typography sx={{ color: shell.textActive, fontWeight: 700, fontSize: 16, letterSpacing: "0.06em" }}>
            AUTOTECH
          </Typography>
        </Box>
        <Box sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4.5 } }}>{children}</Box>
      </Paper>
    </Box>
  );
}
