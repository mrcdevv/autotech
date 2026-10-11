import { Box, Typography } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

interface RowTextProps {
  primary: ReactNode;
  secondary?: ReactNode;
  sx?: SxProps<Theme>;
}

export function RowText({ primary, secondary, sx }: RowTextProps) {
  return (
    <Box
      sx={[
        { flex: 1, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "0.8125rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {primary}
      </Typography>
      {secondary && (
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "text.muted",
            mt: "1px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {secondary}
        </Typography>
      )}
    </Box>
  );
}
