import { Box } from "@mui/material";

import { CHART_COLORS } from "@/features/dashboard/utils/chartTheme";

const BAR_GRADIENTS = [
  { key: "graphite", colors: CHART_COLORS.graphite },
  { key: "orange", colors: CHART_COLORS.orange },
  { key: "blue", colors: CHART_COLORS.blue },
  { key: "green", colors: CHART_COLORS.green },
  { key: "red", colors: CHART_COLORS.red },
];

export function BarGradientDefs() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      sx={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        {BAR_GRADIENTS.map(({ key, colors }) => (
          <linearGradient
            key={key}
            id={`autotech-bar-${key}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={colors.light} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colors.dark} stopOpacity="0.95" />
          </linearGradient>
        ))}
      </defs>
    </Box>
  );
}
