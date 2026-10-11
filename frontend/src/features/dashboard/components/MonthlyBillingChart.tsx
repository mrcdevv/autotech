import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import { barFillStyle } from "@/features/dashboard/utils/barStyle";
import {
  MONTH_LABELS,
  buildMonthlyBillingBuckets,
} from "@/features/dashboard/utils/reportPeriod";
import {
  AXIS_TICK_LABEL,
  BASE_CHART_SX,
  CHART_ANIMATION_SX,
  CHART_COLORS,
} from "@/features/dashboard/utils/chartTheme";
import { formatCurrencyWhole } from "@/utils/formatCurrency";

import { BarGradientDefs } from "./BarGradientDefs";

import type { MonthlyRevenueResponse } from "@/features/dashboard/types";

interface MonthlyBillingChartProps {
  data: MonthlyRevenueResponse[];
  from: string;
  to: string;
}

export function MonthlyBillingChart({ data, from, to }: MonthlyBillingChartProps) {
  const buckets = buildMonthlyBillingBuckets(data, from, to);
  const labels = buckets.map((item) => `${MONTH_LABELS[item.month - 1]} ${item.year}`);
  const values = buckets.map((item) => item.total);

  return (
    <Box sx={{ width: "100%" }}>
      <BarGradientDefs />
      <BarChart
        height={320}
        borderRadius={6}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        hideLegend
        grid={{ horizontal: true }}
        xAxis={[
          {
            scaleType: "band",
            data: labels,
            disableLine: true,
            disableTicks: true,
            tickLabelStyle: AXIS_TICK_LABEL,
          },
        ]}
        yAxis={[{ disableLine: true, disableTicks: true, tickLabelStyle: AXIS_TICK_LABEL }]}
        series={[
          {
            data: values,
            label: "Facturación",
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
