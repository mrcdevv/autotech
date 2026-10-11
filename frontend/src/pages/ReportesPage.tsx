import { useState } from "react";

import Grid from "@mui/material/Grid2";
import dayjs from "dayjs";

import { PageShell } from "@/components/PageShell";
import { BrandsChart } from "@/features/dashboard/components/BrandsChart";
import { BrandFilterSelect } from "@/features/dashboard/components/BrandFilterSelect";
import { MonthlyBillingChart } from "@/features/dashboard/components/MonthlyBillingChart";
import { RankedBarList } from "@/features/dashboard/components/RankedBarList";
import { ReportChartCard } from "@/features/dashboard/components/ReportChartCard";
import { ReportPeriodFilter } from "@/features/dashboard/components/ReportPeriodFilter";
import { ServiceRevenueChart } from "@/features/dashboard/components/ServiceRevenueChart";
import { useFaults } from "@/features/dashboard/hooks/useFaults";
import { useReports } from "@/features/dashboard/hooks/useReports";
import { CHART_COLORS } from "@/features/dashboard/utils/chartTheme";
import { resolvePeriod } from "@/features/dashboard/utils/reportPeriod";
import { useBrands } from "@/features/vehicles/hooks/useBrands";

import type { ReportPeriodPreset } from "@/features/dashboard/utils/reportPeriod";

export default function ReportesPage() {
  const [preset, setPreset] = useState<ReportPeriodPreset>("thisMonth");
  const [customFrom, setCustomFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [customTo, setCustomTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [brandId, setBrandId] = useState<number | null>(null);

  const period = resolvePeriod(preset, customFrom, customTo);
  const { data, loading, error } = useReports(period.from, period.to);
  const { data: faults, loading: faultsLoading, error: faultsError } = useFaults(
    period.from,
    period.to,
    brandId
  );
  const { brands } = useBrands();

  const monthlyBilling = data?.monthlyBilling ?? [];
  const topServices = data?.topServices ?? [];
  const serviceRevenue = data?.serviceRevenue ?? [];
  const brandCounts = data?.brandCounts ?? [];

  return (
    <PageShell
      title="Reportes"
      actions={
        <ReportPeriodFilter
          preset={preset}
          customFrom={customFrom}
          customTo={customTo}
          onPresetChange={setPreset}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      }
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ReportChartCard
            title="Facturación por mes"
            loading={loading}
            error={error}
            isEmpty={monthlyBilling.length === 0}
          >
            <MonthlyBillingChart data={monthlyBilling} from={period.from} to={period.to} />
          </ReportChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ReportChartCard
            title="Marcas de vehículos más atendidas"
            loading={loading}
            error={error}
            isEmpty={brandCounts.length === 0}
          >
            <BrandsChart data={brandCounts} />
          </ReportChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ReportChartCard
            title="Servicios más realizados"
            loading={loading}
            error={error}
            isEmpty={topServices.length === 0}
          >
            <RankedBarList
              data={topServices.map((item) => ({
                label: item.serviceName,
                value: item.count,
              }))}
              colors={CHART_COLORS.graphite}
            />
          </ReportChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <ReportChartCard
            title="Averías más frecuentes"
            loading={faultsLoading}
            error={faultsError}
            isEmpty={faults.length === 0}
            action={
              <BrandFilterSelect
                brands={brands}
                brandId={brandId}
                onChange={setBrandId}
              />
            }
          >
            <RankedBarList
              data={faults.map((item) => ({
                label: item.faultName,
                value: item.count,
              }))}
              colors={CHART_COLORS.graphite}
            />
          </ReportChartCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ReportChartCard
            title="Ingresos generados por servicio"
            loading={loading}
            error={error}
            isEmpty={serviceRevenue.length === 0}
          >
            <ServiceRevenueChart data={serviceRevenue} />
          </ReportChartCard>
        </Grid>
      </Grid>
    </PageShell>
  );
}
