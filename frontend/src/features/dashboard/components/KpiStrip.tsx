import { Box } from "@mui/material";

import { StatCard } from "@/components/StatCard";
import type { KpiView } from "@/features/dashboard/utils/homeView";

interface KpiStripProps {
  kpis: KpiView[];
}

export function KpiStrip({ kpis }: KpiStripProps) {
  return (
    <Box
      data-testid="kpi-strip"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: `repeat(${kpis.length}, minmax(0, 1fr))`,
        },
        gap: "1px",
        bgcolor: "divider",
        border: "1px solid",
        borderColor: "divider",
        mb: "16px",
      }}
    >
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          hint={kpi.hint}
          valueColor={kpi.valueColor}
        />
      ))}
    </Box>
  );
}
