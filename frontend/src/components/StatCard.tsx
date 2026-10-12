import { Box, Typography } from "@mui/material";

import type { ReactNode } from "react";

import { MonoText } from "./MonoText";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  valueColor?: string;
  icon?: ReactNode;
  /** Opt-in right alignment for the value. Money amounts only — counts stay left.
   *  The alignment is applied on a BLOCK carrier (a Box div) wrapping the value,
   *  never on the inline MonoText span, where text-align does nothing. */
  alignValue?: "left" | "right";
}

const VALUE_SX = {
  display: "block",
  fontSize: "1.625rem",
  fontWeight: 500,
  lineHeight: 1.2,
  mt: "8px",
  mb: "3px",
} as const;

export function StatCard({ label, value, hint, valueColor = "text.primary", icon, alignValue = "left" }: StatCardProps) {
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
      {alignValue === "right" ? (
        <Box sx={{ textAlign: "right" }}>
          <MonoText sx={{ ...VALUE_SX, color: valueColor }}>{value}</MonoText>
        </Box>
      ) : (
        <MonoText sx={{ ...VALUE_SX, color: valueColor }}>{value}</MonoText>
      )}
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
