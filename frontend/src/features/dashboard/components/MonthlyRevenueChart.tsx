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

function getMonthlyRevenueWithEmptyMonths(data: MonthlyRevenueResponse[], months: number) {
  const totalsByMonth = new Map(
    data.map((item) => [`${item.year}-${item.month}`, item.total])
  );
  const currentMonth = new Date();

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - months + 1 + index,
      1
    );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return {
      year,
      month,
      total: totalsByMonth.get(`${year}-${month}`) ?? 0,
    };
  });
}

export function MonthlyRevenueChart({ data, months, onMonthsChange }: MonthlyRevenueChartProps) {
  const monthlyRevenue = getMonthlyRevenueWithEmptyMonths(data, months);
  const labels = monthlyRevenue.map((d) => `${MONTH_LABELS[d.month - 1]} ${d.year}`);
  const values = monthlyRevenue.map((d) => d.total);

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
      {monthlyRevenue.length === 0 ? (
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
