import { Box } from "@mui/material";

import { StatCard } from "@/components/StatCard";

import type { KpiView } from "@/features/dashboard/utils/homeView";

interface ReportKpiGridProps {
  kpis: KpiView[];
}

export function ReportKpiGrid({ kpis }: ReportKpiGridProps) {
  return (
    <Box
      data-testid="report-kpis"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(6, minmax(0, 1fr))",
        },
        gap: "1px",
        bgcolor: "divider",
        border: "1px solid",
        borderColor: "divider",
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
