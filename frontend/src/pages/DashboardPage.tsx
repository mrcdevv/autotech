import { useState } from "react";
import { Box, Typography, CircularProgress, Alert, Tabs, Tab } from "@mui/material";
import Grid from "@mui/material/Grid2";
import BuildIcon from "@mui/icons-material/Build";
import EventIcon from "@mui/icons-material/Event";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { KpiCard } from "@/features/dashboard/components/KpiCard";
import { StatusBreakdownCard } from "@/features/dashboard/components/StatusBreakdownCard";
import { TodayAppointmentsList } from "@/features/dashboard/components/TodayAppointmentsList";
import { StaleOrderAlerts } from "@/features/dashboard/components/StaleOrderAlerts";
import { PendingEstimateAlerts } from "@/features/dashboard/components/PendingEstimateAlerts";
import { FinancieroTab } from "@/features/dashboard/components/FinancieroTab";
import { ProductividadTab } from "@/features/dashboard/components/ProductividadTab";
import { formatCurrency } from "@/utils/formatCurrency";

export default function DashboardPage() {
  const { summary, loading, error } = useDashboard();
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!summary) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Inicio
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Órdenes abiertas" value={summary.openRepairOrderCount} icon={<BuildIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Citas de hoy" value={summary.todayAppointmentCount} icon={<EventIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Facturación del mes" value={formatCurrency(summary.monthlyRevenue)} icon={<TrendingUpIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Ticket promedio" value={formatCurrency(summary.averageTicket)} icon={<ReceiptIcon color="primary" fontSize="large" />} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatusBreakdownCard statusCounts={summary.repairOrderStatusCounts} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TodayAppointmentsList appointments={summary.todayAppointments} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StaleOrderAlerts alerts={summary.staleOrderAlerts} thresholdDays={summary.staleThresholdDays} />
          <PendingEstimateAlerts alerts={summary.pendingEstimateAlerts} thresholdDays={summary.staleThresholdDays} />
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Financiero" />
        <Tab label="Productividad" />
      </Tabs>

      {activeTab === 0 && <FinancieroTab />}
      {activeTab === 1 && <ProductividadTab />}
    </Box>
  );
}
