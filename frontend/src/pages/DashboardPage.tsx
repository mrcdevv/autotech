import { Box, Typography, CircularProgress, Alert, Button } from "@mui/material";
import Grid from "@mui/material/Grid2";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import DescriptionIcon from "@mui/icons-material/Description";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { KpiCard } from "@/features/dashboard/components/KpiCard";
import { StatusBreakdownCard } from "@/features/dashboard/components/StatusBreakdownCard";
import { TodayAppointmentsList } from "@/features/dashboard/components/TodayAppointmentsList";
import { ReadyForPickupList } from "@/features/dashboard/components/ReadyForPickupList";
import { StaleOrderAlerts } from "@/features/dashboard/components/StaleOrderAlerts";
import { PendingEstimateAlerts } from "@/features/dashboard/components/PendingEstimateAlerts";

export default function DashboardPage() {
  const { summary, loading, error } = useDashboard();
  const navigate = useNavigate();

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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Inicio</Typography>
        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={() => navigate("/reportes")}
        >
          Ver reportes
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Vehículos en taller" value={summary.openRepairOrderCount} icon={<DirectionsCarIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Listas para entregar" value={summary.readyForPickupCount} icon={<CheckCircleIcon color="success" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Citas de hoy" value={summary.todayAppointmentCount} icon={<EventIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Presupuestos pendientes" value={summary.pendingEstimateCount} icon={<DescriptionIcon color="warning" fontSize="large" />} />
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
          <ReadyForPickupList orders={summary.readyForPickupOrders} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StaleOrderAlerts alerts={summary.staleOrderAlerts} thresholdDays={summary.staleThresholdDays} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PendingEstimateAlerts alerts={summary.pendingEstimateAlerts} thresholdDays={summary.staleThresholdDays} />
        </Grid>
      </Grid>
    </Box>
  );
}
