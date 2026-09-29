import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import { barFillStyle } from "@/features/dashboard/utils/barStyle";
import {
  AXIS_TICK_LABEL,
  BASE_CHART_SX,
  CHART_ANIMATION_SX,
  CHART_COLORS,
  wrapLabel,
} from "@/features/dashboard/utils/chartTheme";
import { formatCurrencyWhole } from "@/utils/formatCurrency";

import { BarGradientDefs } from "./BarGradientDefs";

import type { ServiceRevenueResponse } from "@/features/dashboard/types";

interface ServiceRevenueChartProps {
  data: ServiceRevenueResponse[];
}

export function ServiceRevenueChart({ data }: ServiceRevenueChartProps) {
  const labels = data.map((item) => item.serviceName);
  const values = data.map((item) => item.totalRevenue);

  return (
    <Box sx={{ width: "100%" }}>
      <BarGradientDefs />
      <BarChart
        height={320}
        borderRadius={6}
        margin={{ top: 8, right: 8, bottom: 56, left: 0 }}
        hideLegend
        grid={{ horizontal: true }}
        xAxis={[
          {
            scaleType: "band",
            data: labels.map((label) => wrapLabel(label, 12)),
            disableLine: true,
            disableTicks: true,
            tickLabelStyle: AXIS_TICK_LABEL,
          },
        ]}
        yAxis={[{ disableLine: true, disableTicks: true, tickLabelStyle: AXIS_TICK_LABEL }]}
        series={[
          {
            data: values,
            label: "Ingresos",
            color: CHART_COLORS.graphite.base,
            valueFormatter: (value) =>
              value == null ? "" : formatCurrencyWhole(value),
          },
        ]}
        slotProps={{ bar: { style: barFillStyle("graphite") } }}
        sx={[BASE_CHART_SX, CHART_ANIMATION_SX]}
      />
    </Box>
  );
}
