import { useMemo, useState } from "react";

import { Alert, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import dayjs from "dayjs";

import { PageShell } from "@/components/PageShell";
import { BrandFilterSelect } from "@/features/dashboard/components/BrandFilterSelect";
import { DebtAgingCard } from "@/features/dashboard/components/DebtAgingCard";
import { MechanicProductivityList } from "@/features/dashboard/components/MechanicProductivityList";
import { MonthlyBillingChart } from "@/features/dashboard/components/MonthlyBillingChart";
import { RankedBarList } from "@/features/dashboard/components/RankedBarList";
import { ReportChartCard } from "@/features/dashboard/components/ReportChartCard";
import { ReportInsights } from "@/features/dashboard/components/ReportInsights";
import { ReportKpiGrid } from "@/features/dashboard/components/ReportKpiGrid";
import { ReportPeriodFilter } from "@/features/dashboard/components/ReportPeriodFilter";
import { ServiceStatsTable } from "@/features/dashboard/components/ServiceStatsTable";
import { UnpaidDeliveryNotesTable } from "@/features/dashboard/components/UnpaidDeliveryNotesTable";
import { useFaults } from "@/features/dashboard/hooks/useFaults";
import { useReportExport } from "@/features/dashboard/hooks/useReportExport";
import { useReports } from "@/features/dashboard/hooks/useReports";
import { CHART_COLORS } from "@/features/dashboard/utils/chartTheme";
import { buildReportInsights } from "@/features/dashboard/utils/reportInsights";
import { buildReportKpis } from "@/features/dashboard/utils/reportKpis";
import { resolvePeriod, resolvePreviousPeriod } from "@/features/dashboard/utils/reportPeriod";
import { useBrands } from "@/features/vehicles/hooks/useBrands";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ReportPeriodPreset } from "@/features/dashboard/utils/reportPeriod";

export default function ReportesPage() {
  const [preset, setPreset] = useState<ReportPeriodPreset>("thisMonth");
  const [customFrom, setCustomFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [customTo, setCustomTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [compare, setCompare] = useState(false);
  const [brandId, setBrandId] = useState<number | null>(null);

  const period = resolvePeriod(preset, customFrom, customTo);
  const previousPeriod = resolvePreviousPeriod(period.from, period.to);

  const { data, loading, error } = useReports(period.from, period.to);
  // Only asked for when comparing; an empty range keeps the hook idle otherwise.
  const previous = useReports(
    compare ? previousPeriod.from : "",
    compare ? previousPeriod.to : ""
  );
  const faults = useFaults(period.from, period.to, brandId);
  const { brands } = useBrands();
  const reportExport = useReportExport(period.from, period.to);

  const kpis = useMemo(
    () => (data ? buildReportKpis(data.kpis, compare ? previous.data?.kpis : null) : []),
    [data, compare, previous.data]
  );
  const insights = useMemo(
    () => (data ? buildReportInsights(data, period.from, period.to) : []),
    [data, period.from, period.to]
  );

  const unpaidTotal = data?.unpaidDeliveryNotes.reduce((sum, note) => sum + note.total, 0) ?? 0;

  return (
    <PageShell
      title="Reportes"
      actions={
        // Full width so the filters start at the left edge (PageShell right-aligns its actions);
        // the export button pushes itself to the right edge.
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ md: "center" }}
          useFlexGap
          flexWrap="wrap"
          sx={{ width: "100%" }}
        >
          <ReportPeriodFilter
            preset={preset}
            customFrom={customFrom}
            customTo={customTo}
            onPresetChange={setPreset}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          <FormControlLabel
            control={<Checkbox checked={compare} onChange={(event) => setCompare(event.target.checked)} />}
            label="Comparar con período anterior"
          />
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={reportExport.exportToExcel}
            disabled={reportExport.exporting || loading}
            sx={{ ml: { md: "auto" } }}
          >
            {reportExport.exporting ? "Exportando…" : "Exportar Excel"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        {reportExport.error && (
          <Alert severity="error" onClose={reportExport.clearError}>
            {reportExport.error}
          </Alert>
        )}

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          kpis.length > 0 && <ReportKpiGrid kpis={kpis} />
        )}
        <ReportInsights insights={insights} />

        <SectionTitle>Finanzas</SectionTitle>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ReportChartCard
              title="Facturado vs. cobrado por mes"
              loading={loading}
              error={error}
              isEmpty={(data?.monthlyBilling.length ?? 0) === 0}
            >
              <MonthlyBillingChart data={data?.monthlyBilling ?? []} from={period.from} to={period.to} />
            </ReportChartCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ReportChartCard title="Antigüedad de la deuda" loading={loading} error={error} isEmpty={false}>
              <DebtAgingCard data={data?.debtAging ?? []} />
            </ReportChartCard>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ReportChartCard
              title="Remitos pendientes de cobro"
              subtitle={
                data && data.unpaidDeliveryNotes.length > 0
                  ? `${formatCurrency(unpaidTotal)} a la fecha de hoy, los más antiguos primero`
                  : undefined
              }
              loading={loading}
              error={error}
              isEmpty={false}
            >
              <UnpaidDeliveryNotesTable deliveryNotes={data?.unpaidDeliveryNotes ?? []} />
            </ReportChartCard>
          </Grid>
        </Grid>

        <SectionTitle>Servicios y averías</SectionTitle>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <ReportChartCard
              title="Servicios: cuántas veces y cuánto dejan"
              subtitle="Solo mano de obra; los repuestos y el IVA no están incluidos."
              loading={loading}
              error={error}
              isEmpty={(data?.services.length ?? 0) === 0}
            >
              <ServiceStatsTable services={data?.services ?? []} />
            </ReportChartCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <ReportChartCard
              title="Averías más frecuentes"
              subtitle="Ítems marcados “Problema” o “Revisar” en inspecciones"
              loading={faults.loading}
              error={faults.error}
              isEmpty={faults.data.length === 0}
              action={<BrandFilterSelect brands={brands} brandId={brandId} onChange={setBrandId} />}
            >
              <RankedBarList
                data={faults.data.map((item) => ({ label: item.faultName, value: item.count }))}
                colors={CHART_COLORS.orange}
              />
            </ReportChartCard>
          </Grid>
        </Grid>

        <SectionTitle>Taller</SectionTitle>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportChartCard
              title="Marcas atendidas"
              loading={loading}
              error={error}
              isEmpty={(data?.brandCounts.length ?? 0) === 0}
            >
              <RankedBarList
                data={(data?.brandCounts ?? []).map((item) => ({ label: item.brandName, value: item.count }))}
                colors={CHART_COLORS.graphite}
              />
            </ReportChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportChartCard
              title="Órdenes entregadas por mecánico"
              loading={loading}
              error={error}
              isEmpty={false}
            >
              <MechanicProductivityList mechanics={data?.mechanicProductivity ?? []} />
            </ReportChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportChartCard
              title="Tiempo promedio de reparación"
              subtitle="Desde el ingreso hasta la entrega, en órdenes entregadas en el período"
              loading={loading}
              error={error}
              isEmpty={!data || data.averageRepairDays === 0}
            >
              <Typography sx={{ fontSize: "2.5rem", fontWeight: 600, lineHeight: 1.1 }}>
                {data?.averageRepairDays.toLocaleString("es-AR", { maximumFractionDigits: 1 })}{" "}
                <Typography component="span" color="text.secondary" sx={{ fontSize: "1.125rem" }}>
                  días
                </Typography>
              </Typography>
            </ReportChartCard>
          </Grid>
        </Grid>
      </Stack>
    </PageShell>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="overline" component="h2" sx={{ color: "text.muted", mb: -1.5 }}>
      {children}
    </Typography>
  );
}
