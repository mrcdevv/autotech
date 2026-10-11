import { Box } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PanelRowProps {
  children: ReactNode;
  align?: "center" | "baseline" | "flex-start";
  sx?: SxProps<Theme>;
}

export function PanelRow({ children, align = "center", sx }: PanelRowProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: align,
          gap: "12px",
          py: "10px",
          borderTop: "1px dashed",
          borderColor: "grey.400",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
