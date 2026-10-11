import { Box } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface FormPageLayoutProps {
  children: ReactNode;
  aside?: ReactNode;
  asideWidth?: number;
  maxWidth?: number;
  sx?: SxProps<Theme>;
}

export function FormPageLayout({
  children,
  aside,
  asideWidth = 360,
  maxWidth,
  sx,
}: FormPageLayoutProps) {
  return (
    <Box
      sx={[
        { width: "100%" },
        ...(maxWidth ? [{ maxWidth, mx: "auto" }] : []),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: aside ? `minmax(0, 1fr) ${asideWidth}px` : "minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>{children}</Box>
        {aside && (
          <Box
            sx={{
              minWidth: 0,
              position: { xs: "static", lg: "sticky" },
              top: { lg: 16 },
            }}
          >
            {aside}
          </Box>
        )}
      </Box>
    </Box>
  );
}
