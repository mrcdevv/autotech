import { Link } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PanelLinkProps {
  children: ReactNode;
  onClick: () => void;
  sx?: SxProps<Theme>;
}

export function PanelLink({ children, onClick, sx }: PanelLinkProps) {
  return (
    <Link
      component="button"
      type="button"
      onClick={onClick}
      sx={[
        {
          fontSize: "0.78125rem",
          fontWeight: 500,
          color: "primary.main",
          textDecoration: "none",
          "&:hover": { color: "primary.light", textDecoration: "underline" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Link>
  );
}
