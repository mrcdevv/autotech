import { useState } from "react";
import { Box, Button, CircularProgress, Alert, Card, CardContent } from "@mui/material";
import Grid from "@mui/material/Grid2";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useFinanciero } from "@/features/dashboard/hooks/useFinanciero";
import { KpiCard } from "./KpiCard";
import { MonthlyRevenueChart } from "./MonthlyRevenueChart";
import { DebtAgingTable } from "./DebtAgingTable";
import { TopUnpaidInvoicesList } from "./TopUnpaidInvoicesList";
import { formatCurrency } from "@/utils/formatCurrency";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export function FinancieroTab() {
  const [months, setMonths] = useState(6);
  const { data, loading, error, exportToExcel } = useFinanciero(months);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={exportToExcel}
        >
          Exportar a Excel
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <MonthlyRevenueChart data={data.monthlyRevenue} months={months} onMonthsChange={setMonths} />
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard
            title="Tasa de conversión"
            value={`${data.estimateConversionRate.toFixed(1)}%`}
            icon={<PercentIcon color="primary" fontSize="large" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard
            title="Presupuestos aceptados / total"
            value={`${data.estimatesAccepted} / ${data.estimatesTotal}`}
            icon={<PercentIcon color="secondary" fontSize="large" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard
            title="Facturación pendiente"
            value={formatCurrency(data.totalPendingBilling)}
            icon={<AttachMoneyIcon color="warning" fontSize="large" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <DebtAgingTable data={data.debtAging} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TopUnpaidInvoicesList invoices={data.topUnpaidInvoices} />
        </Grid>
      </Grid>
    </Box>
  );
}
