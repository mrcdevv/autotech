import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { MonthlyRevenueResponse } from "@/features/dashboard/types";

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueResponse[];
  months: number;
  onMonthsChange: (months: number) => void;
}

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function MonthlyRevenueChart({ data, months, onMonthsChange }: MonthlyRevenueChartProps) {
  const labels = data.map((d) => `${MONTH_LABELS[d.month - 1]} ${d.year}`);
  const values = data.map((d) => d.total);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Ingresos mensuales</Typography>
        <ToggleButtonGroup
          value={months}
          exclusive
          onChange={(_, val) => val !== null && onMonthsChange(val)}
          size="small"
        >
          <ToggleButton value={6}>6 meses</ToggleButton>
          <ToggleButton value={12}>12 meses</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {data.length === 0 ? (
        <Typography color="text.secondary">No hay datos de ingresos</Typography>
      ) : (
        <BarChart
          xAxis={[{ scaleType: "band", data: labels }]}
          series={[{ data: values, label: "Ingresos ($)", color: "#1976d2" }]}
          height={300}
        />
      )}
    </Box>
  );
}
