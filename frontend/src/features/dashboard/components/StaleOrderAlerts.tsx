import { Card, CardContent, Typography, Alert, Stack } from "@mui/material";
import type { StaleOrderAlertResponse } from "@/features/dashboard/types";

interface StaleOrderAlertsProps {
  alerts: StaleOrderAlertResponse[];
  thresholdDays: number;
}

export function StaleOrderAlerts({ alerts, thresholdDays }: StaleOrderAlertsProps) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Órdenes inactivas (+{thresholdDays} días)
        </Typography>
        {alerts.length === 0 ? (
          <Typography color="text.secondary">No hay órdenes inactivas</Typography>
        ) : (
          <Stack spacing={1}>
            {alerts.map((alert) => (
              <Alert key={alert.repairOrderId} severity="warning" variant="outlined">
                <Typography variant="body2">
                  <strong>{alert.title ?? `Orden #${alert.repairOrderId}`}</strong>
                  {" — "}{alert.clientFullName} ({alert.vehiclePlate})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {alert.daysSinceLastUpdate} días sin actualización
                </Typography>
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
