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
          <PanelRow key={alert.estimateId}>
            {/* The amount gets its own block (a Typography <p>) carrying the explicit
                right alignment; the client/plate block keeps its own box, so neither
                shares a block where alignment would move the label too. */}
            <RowText primary={alert.clientFullName} secondary={alert.vehiclePlate} />
            <Typography sx={{ textAlign: "right", flex: 1, minWidth: 0 }}>
              <MonoText>{formatCurrency(alert.total)}</MonoText>
            </Typography>
            <StatusBadge tone="info" label={`${alert.daysPending} días`} />
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
