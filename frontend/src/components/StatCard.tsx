import { Box, Typography } from "@mui/material";

import type { ReactNode } from "react";

import { MonoText } from "./MonoText";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  valueColor?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, valueColor = "text.primary", icon }: StatCardProps) {
  return (
    <Box sx={{ bgcolor: "background.paper", p: "16px 18px", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
        {icon}
      </Box>
      <MonoText
        sx={{
          display: "block",
          fontSize: "1.625rem",
          fontWeight: 500,
          lineHeight: 1.2,
          color: valueColor,
          mt: "8px",
          mb: "3px",
        }}
      >
        {value}
      </MonoText>
      {hint && (
        <Typography
          sx={{
            fontSize: "0.78125rem",
            color: "text.muted",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}
