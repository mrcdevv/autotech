import { PieChart } from "@mui/x-charts/PieChart";

import {
  BASE_CHART_SX,
  CHART_ANIMATION_SX,
  CHART_PALETTE,
} from "@/features/dashboard/utils/chartTheme";

import type { BrandCountResponse } from "@/features/dashboard/types";

interface BrandsChartProps {
  data: BrandCountResponse[];
}

export function BrandsChart({ data }: BrandsChartProps) {
  return (
    <PieChart
      height={300}
      series={[
        {
          data: data.map((item, index) => ({
            id: item.brandName,
            value: item.count,
            label: item.brandName,
            color: CHART_PALETTE[index % CHART_PALETTE.length],
          })),
          innerRadius: "58%",
          paddingAngle: 3,
          cornerRadius: 6,
          arcLabel: (item) => `${item.value}`,
          arcLabelMinAngle: 25,
        },
      ]}
      sx={[BASE_CHART_SX, CHART_ANIMATION_SX]}
    />
  );
}
