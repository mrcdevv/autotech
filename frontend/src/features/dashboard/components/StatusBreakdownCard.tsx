import { Card, CardContent, Typography, Stack, Chip } from "@mui/material";
import type { StatusCountResponse } from "@/features/dashboard/types";

interface StatusBreakdownCardProps {
  statusCounts: StatusCountResponse[];
}

const STATUS_LABELS: Record<string, string> = {
  INGRESO_VEHICULO: "Ingreso",
  ESPERANDO_APROBACION_PRESUPUESTO: "Esperando aprobación",
  ESPERANDO_REPUESTOS: "Esperando repuestos",
  REPARACION: "Reparación",
  PRUEBAS: "Pruebas",
  LISTO_PARA_ENTREGAR: "Listo para entregar",
  ENTREGADO: "Entregado",
};

const STATUS_COLORS: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "info" | "error"> = {
  INGRESO_VEHICULO: "info",
  ESPERANDO_APROBACION_PRESUPUESTO: "warning",
  ESPERANDO_REPUESTOS: "warning",
  REPARACION: "primary",
  PRUEBAS: "secondary",
  LISTO_PARA_ENTREGAR: "success",
  ENTREGADO: "default",
};

export function StatusBreakdownCard({ statusCounts }: StatusBreakdownCardProps) {
  if (statusCounts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Estado de órdenes
          </Typography>
          <Typography color="text.secondary">Sin órdenes registradas</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Estado de órdenes
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {statusCounts.map((sc) => (
            <Chip
              key={sc.status}
              label={`${STATUS_LABELS[sc.status] ?? sc.status}: ${sc.count}`}
              color={STATUS_COLORS[sc.status] ?? "default"}
              size="small"
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
