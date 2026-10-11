import { Alert, Box, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router";

import { DailyCash } from "@/features/dashboard/components/DailyCash";
import { PendingEstimateAlerts } from "@/features/dashboard/components/PendingEstimateAlerts";
import { StaleOrderAlerts } from "@/features/dashboard/components/StaleOrderAlerts";
import { UpcomingAppointments } from "@/features/dashboard/components/UpcomingAppointments";
import { WorkQueue } from "@/features/dashboard/components/WorkQueue";
import { WorkshopCarousel } from "@/features/dashboard/components/WorkshopCarousel";
import { useHomeDashboard } from "@/features/dashboard/hooks/useHomeDashboard";
import {
  buildDailyCash,
  buildUpcomingAppointments,
  buildWorkQueue,
  buildWorkshopCarousel,
} from "@/features/dashboard/utils/homeView";

export default function DashboardPage() {
  const { summary, orders, appointments, invoices, loading, error } = useHomeDashboard();
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

  const carousel = buildWorkshopCarousel(orders);
  const queue = buildWorkQueue(orders);
  const upcomingAppointments = buildUpcomingAppointments(appointments);
  const cash = buildDailyCash(invoices);

  return (
    <Box>
      <WorkshopCarousel items={carousel} onOpen={(id) => navigate(`/ordenes-trabajo/${id}`)} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.6fr) minmax(0, 1fr)" },
          gap: "16px",
          alignItems: "start",
        }}
      >
        <WorkQueue items={queue} onViewOrders={() => navigate("/ordenes-trabajo")} />

        <Box sx={{ display: "grid", gap: "16px", minWidth: 0 }}>
          <UpcomingAppointments
            appointments={upcomingAppointments}
            onViewCalendar={() => navigate("/calendario")}
          />
          <DailyCash cash={cash} />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
          gap: "16px",
          mt: "16px",
        }}
      >
        <StaleOrderAlerts
          alerts={summary.staleOrderAlerts}
          thresholdDays={summary.staleThresholdDays}
        />
        <PendingEstimateAlerts
          alerts={summary.pendingEstimateAlerts}
          thresholdDays={summary.staleThresholdDays}
        />
      </Box>
    </Box>
  );
}
