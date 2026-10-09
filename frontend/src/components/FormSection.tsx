import { Box, Paper, Typography } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface FormSectionProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function FormSection({ title, icon, count, action, children, className, sx, contentSx }: FormSectionProps) {
  return (
    <Paper
      className={className}
      sx={[
        { p: 0, overflow: "hidden" },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {icon}
        <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
          {title}
        </Typography>
        {count !== undefined && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {count}
          </Typography>
        )}
        {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
      </Box>

      <Box
        sx={[
          { p: 3 },
          ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : []),
        ]}
      >
        {children}
      </Box>
    </Paper>
  );
}
