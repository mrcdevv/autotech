import { Box, Typography } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface PanelProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function Panel({ title, action, children, testId, sx, contentSx }: PanelProps) {
  return (
    <Box
      data-testid={testId}
      sx={[
        {
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          p: "14px 16px",
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {(title || action) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 1.5,
          }}
        >
          {title && (
            <Typography variant="overline" sx={{ color: "text.muted" }}>
              {title}
            </Typography>
          )}
          {action}
        </Box>
      )}
      <Box sx={contentSx}>{children}</Box>
    </Box>
  );
}
