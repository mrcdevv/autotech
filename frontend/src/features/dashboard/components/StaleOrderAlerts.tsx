import { Typography } from "@mui/material";

import { Panel } from "@/components/Panel";
import { PanelRow } from "@/components/PanelRow";
import { RowText } from "@/components/RowText";
import { StatusBadge } from "@/components/StatusBadge";
import type { StaleOrderAlertResponse } from "@/features/dashboard/types";

interface StaleOrderAlertsProps {
  alerts: StaleOrderAlertResponse[];
  thresholdDays: number;
}

export function StaleOrderAlerts({ alerts, thresholdDays }: StaleOrderAlertsProps) {
  return (
    <Panel title={`Órdenes inactivas (+${thresholdDays} días)`} contentSx={{ mt: "2px" }}>
      {alerts.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          No hay órdenes inactivas
        </Typography>
      ) : (
        alerts.map((alert) => (
          <PanelRow
            key={alert.repairOrderId}
            to={`/ordenes-trabajo/${alert.repairOrderId}`}
            ariaLabel={`Ir a la orden de trabajo #${alert.repairOrderId} · ${alert.title ?? `Orden #${alert.repairOrderId}`} · ${alert.clientFullName} · ${alert.vehiclePlate} · ${alert.daysSinceLastUpdate} días inactiva`}
          >
            <RowText
              primary={alert.title ?? `Orden #${alert.repairOrderId}`}
              secondary={`${alert.clientFullName} · ${alert.vehiclePlate}`}
            />
            <StatusBadge tone="warn" label={`${alert.daysSinceLastUpdate} días`} />
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
