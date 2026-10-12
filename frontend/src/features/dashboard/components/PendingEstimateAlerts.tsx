import { Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { PanelRow } from "@/components/PanelRow";
import { RowText } from "@/components/RowText";
import { StatusBadge } from "@/components/StatusBadge";
import type { PendingEstimateAlertResponse } from "@/features/dashboard/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface PendingEstimateAlertsProps {
  alerts: PendingEstimateAlertResponse[];
  thresholdDays: number;
}

export function PendingEstimateAlerts({ alerts, thresholdDays }: PendingEstimateAlertsProps) {
  return (
    <Panel title={`Presupuestos pendientes (+${thresholdDays} días)`} contentSx={{ mt: "2px" }}>
      {alerts.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          No hay presupuestos pendientes
        </Typography>
      ) : (
        alerts.map((alert) => (
          <PanelRow
            key={alert.estimateId}
            to={`/presupuestos/${alert.estimateId}`}
            ariaLabel={`Ir al presupuesto #${alert.estimateId} · ${alert.clientFullName} · ${alert.vehiclePlate} · ${alert.daysPending} días pendiente`}
          >
            <RowText
              primary={alert.clientFullName}
              secondary={
                <>
                  {alert.vehiclePlate} · <MonoText>{formatCurrency(alert.total)}</MonoText>
                </>
              }
            />
            <StatusBadge tone="info" label={`${alert.daysPending} días`} />
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
