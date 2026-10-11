import { Box } from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  sx?: SxProps<Theme>;
}

export function ProgressBar({ value, color = "success.main", height = 6, sx }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <Box
      sx={[
        {
          display: "flex",
          height,
          overflow: "hidden",
          bgcolor: "divider",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ width: `${clamped}%`, bgcolor: color }} />
    </Box>
  );
}
