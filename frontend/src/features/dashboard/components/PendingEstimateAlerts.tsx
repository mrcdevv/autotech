import { Card, CardContent, Typography, Alert, Stack } from "@mui/material";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PendingEstimateAlertResponse } from "@/features/dashboard/types";

interface PendingEstimateAlertsProps {
  alerts: PendingEstimateAlertResponse[];
  thresholdDays: number;
}

export function PendingEstimateAlerts({ alerts, thresholdDays }: PendingEstimateAlertsProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Presupuestos pendientes (+{thresholdDays} días)
        </Typography>
        {alerts.length === 0 ? (
          <Typography color="text.secondary">No hay presupuestos pendientes</Typography>
        ) : (
          <Stack spacing={1}>
            {alerts.map((alert) => (
              <Alert key={alert.estimateId} severity="info" variant="outlined">
                <Typography variant="body2">
                  <strong>{alert.clientFullName}</strong> ({alert.vehiclePlate})
                  {" — "}{formatCurrency(alert.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {alert.daysPending} días pendiente
                </Typography>
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
