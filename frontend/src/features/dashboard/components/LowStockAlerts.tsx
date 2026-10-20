import { Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { PanelRow } from "@/components/PanelRow";
import { RowText } from "@/components/RowText";
import { StatusBadge } from "@/components/StatusBadge";
import type { LowStockAlertResponse } from "@/features/dashboard/types";

interface LowStockAlertsProps {
  alerts: LowStockAlertResponse[];
}

export function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  return (
    <Panel title="Stock bajo" contentSx={{ mt: "2px" }}>
      {alerts.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          No hay productos con stock bajo
        </Typography>
      ) : (
        alerts.map((alert) => (
          <PanelRow
            key={alert.productId}
            to="/productos"
            ariaLabel={`Ir a productos · ${alert.productName} · disponible ${alert.availableQuantity} de mínimo ${alert.minStock}`}
          >
            <RowText
              primary={alert.productName}
              secondary={`En stock ${alert.quantity} · Reservado ${alert.reservedQuantity}`}
            />
            <Typography sx={{ textAlign: "right", flex: 1, minWidth: 0 }}>
              <MonoText>
                {alert.availableQuantity} / {alert.minStock}
              </MonoText>
            </Typography>
            <StatusBadge
              tone={alert.quantity < 0 ? "bad" : "warn"}
              label={alert.quantity < 0 ? "Stock negativo" : "Bajo mínimo"}
            />
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
