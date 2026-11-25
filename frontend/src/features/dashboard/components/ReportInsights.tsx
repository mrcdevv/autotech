import { Box, Typography } from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

import { brand, shell } from "@/theme/tokens";

interface ReportInsightsProps {
  insights: string[];
}

/** "Para tener en cuenta": short computed sentences about the period. */
export function ReportInsights({ insights }: ReportInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <Box
      component="ul"
      aria-label="Para tener en cuenta"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
        gap: 1.5,
      }}
    >
      {insights.map((insight) => (
        <Box
          component="li"
          key={insight}
          sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", bgcolor: shell.bg, p: "14px 16px" }}
        >
          <InsightsOutlinedIcon fontSize="small" aria-hidden sx={{ color: brand.accent, mt: "2px" }} />
          <Typography variant="body2" sx={{ color: shell.textActive, lineHeight: 1.5 }}>
            {insight}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
