import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import {
  MONTH_LABELS,
  buildMonthlyBillingBuckets,
} from "@/features/dashboard/utils/reportPeriod";
import {
  AXIS_TICK_LABEL,
  BASE_CHART_SX,
  BILLING_COLORS,
  CHART_ANIMATION_SX,
  CURRENCY_AXIS_WIDTH,
} from "@/features/dashboard/utils/chartTheme";
import { formatCurrencyWhole } from "@/utils/formatCurrency";

import type { MonthlyBillingResponse } from "@/features/dashboard/types";

interface MonthlyBillingChartProps {
  data: MonthlyBillingResponse[];
  from: string;
  to: string;
}

// Whole numbers on purpose (decision D2): chart axes and tooltips stay readable without
// cents. Do NOT switch to formatCurrency here. null/undefined stay empty.
function wholeCurrency(value: number | null | undefined): string {
  return value == null ? "" : formatCurrencyWhole(value);
}

/** Billed per month, split into the collected part and the part still pending. */
export function MonthlyBillingChart({ data, from, to }: MonthlyBillingChartProps) {
  const buckets = buildMonthlyBillingBuckets(data, from, to);
  const labels = buckets.map((item) => `${MONTH_LABELS[item.month - 1]} ${item.year}`);
  const collected = buckets.map((item) => item.collected);
  const pending = buckets.map((item) => Math.max(item.billed - item.collected, 0));

  return (
    <Box sx={{ width: "100%" }}>
      <BarChart
        height={320}
        borderRadius={4}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
        yAxis={[
          {
            width: CURRENCY_AXIS_WIDTH,
            disableLine: true,
            disableTicks: true,
            tickLabelStyle: AXIS_TICK_LABEL,
            // The series valueFormatter feeds tooltips only; ticks need the axis one.
            valueFormatter: wholeCurrency,
          },
        ]}
        series={[
          {
            data: collected,
            label: "Cobrado",
            stack: "billed",
            color: BILLING_COLORS.collected,
            valueFormatter: wholeCurrency,
          },
          {
            data: pending,
            label: "Pendiente",
            stack: "billed",
            color: BILLING_COLORS.pending,
            valueFormatter: wholeCurrency,
          },
        ]}
        slotProps={{ legend: { position: { vertical: "top", horizontal: "end" } } }}
        sx={[BASE_CHART_SX, CHART_ANIMATION_SX]}
      />
    </Box>
  );
}
