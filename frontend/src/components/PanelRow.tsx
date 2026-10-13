import { Box } from "@mui/material";
import { Link } from "react-router";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PanelRowProps {
  children: ReactNode;
  align?: "center" | "baseline" | "flex-start";
  /** Optional navigation target; when present the row renders as a real link. */
  to?: string;
  /** Accessible name for the link (used only when `to` is present). */
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

export function PanelRow({ children, align = "center", to, ariaLabel, sx }: PanelRowProps) {
  return (
    <Box
      {...(to ? { component: Link, to, "aria-label": ariaLabel } : {})}
      sx={[
        {
          display: "flex",
          alignItems: align,
          gap: "12px",
          py: "10px",
          borderTop: "1px dashed",
          borderColor: "grey.400",
          ...(to && { textDecoration: "none", color: "inherit" }),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
