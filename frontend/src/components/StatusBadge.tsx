import { Box } from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

import type { StatusTone } from "@/theme/tokens";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  sx?: SxProps<Theme>;
}

export function StatusBadge({ label, tone = "neutral", sx }: StatusBadgeProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: "inline-block",
          fontSize: "0.6875rem",
          fontWeight: 600,
          lineHeight: 1.7,
          px: "7px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          bgcolor: `status.${tone}.bg`,
          color: `status.${tone}.fg`,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {label}
    </Box>
  );
}
