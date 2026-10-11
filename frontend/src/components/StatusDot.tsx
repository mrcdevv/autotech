import { Box } from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

interface StatusDotProps {
  label: string;
  color: string;
  sx?: SxProps<Theme>;
}

export function StatusDot({ label, color, sx }: StatusDotProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.75rem",
          fontWeight: 500,
          color,
          whiteSpace: "nowrap",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box component="span" sx={{ width: 6, height: 6, flex: "none", bgcolor: color }} />
      {label}
    </Box>
  );
}
