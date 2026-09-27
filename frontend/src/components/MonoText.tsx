import { Box } from "@mui/material";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";

import { font } from "@/theme/tokens";

interface MonoTextProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function MonoText({ children, sx }: MonoTextProps) {
  return (
    <Box
      component="span"
      sx={[
        { fontFamily: font.mono, fontVariantNumeric: "tabular-nums" },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
