import { useState, useEffect } from "react";

import {
  Box,
  Typography,
  CircularProgress,
  Link,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  Divider,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import NotesIcon from "@mui/icons-material/Notes";
import HistoryIcon from "@mui/icons-material/History";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { estimatesApi } from "@/api/estimates";
import { invoicesApi } from "@/api/invoices";
import { paymentsApi } from "@/api/payments";
import { AppDataGrid } from "@/components/AppDataGrid";

import type { GridColDef } from "@mui/x-data-grid";
import type { RepairOrderDetailResponse } from "../types";
import { STATUS_LABELS } from "../types";
import type { EstimateResponse } from "@/types/estimate";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { PaymentSummaryResponse } from "@/types/payment";

interface GeneralInfoTabProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
}

const STATUS_COLORS: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  INGRESO_VEHICULO: "info",
  ESPERANDO_APROBACION_PRESUPUESTO: "warning",
  ESPERANDO_REPUESTOS: "warning",
  REPARACION: "primary",
  PRUEBAS: "secondary",
  LISTO_PARA_ENTREGAR: "success",
  ENTREGADO: "success",
};

export function GeneralInfoTab({ order, loading }: GeneralInfoTabProps) {
  const [estimates, setEstimates] = useState<EstimateResponse[]>([]);
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryResponse | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  useEffect(() => {
    if (!order) return;

    setFinancialLoading(true);
    const fetchFinancialData = async () => {
      try {
        const [estRes, invRes] = await Promise.allSettled([
          estimatesApi.getAllByRepairOrderId(order.id),
          invoicesApi.getByRepairOrderId(order.id),
        ]);

        if (estRes.status === "fulfilled") {
          setEstimates(estRes.value.data.data);
        }

        if (invRes.status === "fulfilled") {
          const inv = invRes.value.data.data;
          setInvoice(inv);
          try {
            const summaryRes = await paymentsApi.getSummary(inv.id);
            setPaymentSummary(summaryRes.data.data);
          } catch {
            // no payments yet
          }
        }
      } finally {
        setFinancialLoading(false);
      }
    };

    fetchFinancialData();
  }, [order]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">No se encontró la orden de trabajo</Typography>
      </Box>
    );
  }

  const createdDate = new Date(order.createdAt);
  const daysInShop = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

  const activeEstimate = estimates.find((e) => e.status === "ACEPTADO")
    ?? estimates.find((e) => e.status === "PENDIENTE");
  const rejectedCount = estimates.filter((e) => e.status === "RECHAZADO").length;

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      flex: 1,
      minWidth: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString("es-AR"),
      sortable: true,
    },
    {
      field: "repairOrderId",
      headerName: "Orden de Trabajo",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Link href={`/ordenes-trabajo/${params.value}`} underline="hover" sx={{ fontWeight: 500 }}>
          OT-{params.value}
        </Link>
      ),
    },
    {
      field: "reason",
      headerName: "Servicio / Motivo",
      flex: 2,
      minWidth: 250,
      valueGetter: (value: string | null) => value || "—",
    },
  ];

  return (
    <Stack spacing={2.5} sx={{ py: 3 }}>
      {/* Estado y Seguimiento */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: "auto" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                Estado
              </Typography>
              <Chip
                label={STATUS_LABELS[order.status]}
                color={STATUS_COLORS[order.status] ?? "default"}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 6, sm: "auto" }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block" }}>
                    Ingreso
                  </Typography>
                  <Typography variant="body2">
                    {createdDate.toLocaleDateString("es-AR")}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 6, sm: "auto" }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block" }}>
                    Días en taller
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: daysInShop > 7 ? "warning.main" : "text.primary" }}>
                    {daysInShop} {daysInShop === 1 ? "día" : "días"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {order.employees.length > 0 && (
              <Grid size={{ xs: 12, sm: "auto" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                  Empleados asignados
                </Typography>
                <AvatarGroup max={4} sx={{ justifyContent: "flex-start" }}>
                  {order.employees.map((emp) => (
                    <Tooltip key={emp.id} title={`${emp.firstName} ${emp.lastName}`}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.main" }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Grid>
            )}

            {order.tags.length > 0 && (
              <Grid size={{ xs: 12, sm: "auto" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                  Etiquetas
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {order.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      sx={{
                        bgcolor: tag.color ?? "grey.200",
                        color: tag.color ? "#fff" : "text.primary",
                        fontWeight: 500,
                        fontSize: 12,
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen Financiero */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ReceiptIcon color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Resumen Financiero
            </Typography>
          </Stack>

          {financialLoading ? (
            <LinearProgress />
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1.5, border: 1, borderColor: "divider", height: "100%" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <AssignmentIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Presupuesto
                    </Typography>
                  </Stack>
                  {activeEstimate ? (
                    <>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        ${activeEstimate.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 }) ?? "—"}
                      </Typography>
                      <Chip
                        label={activeEstimate.status === "ACEPTADO" ? "Aprobado" : "Pendiente"}
                        color={activeEstimate.status === "ACEPTADO" ? "success" : "warning"}
                        size="small"
                      />
                      {rejectedCount > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          {rejectedCount} rechazado{rejectedCount > 1 ? "s" : ""}
                        </Typography>
                      )}
                    </>
                  ) : rejectedCount > 0 ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Sin presupuesto activo
                      </Typography>
                      <Chip label={`${rejectedCount} rechazado${rejectedCount > 1 ? "s" : ""}`} color="error" size="small" />
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin presupuesto
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1.5, border: 1, borderColor: "divider", height: "100%" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <ReceiptIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Factura
                    </Typography>
                  </Stack>
                  {invoice ? (
                    <>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        ${invoice.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 }) ?? "—"}
                      </Typography>
                      <Chip
                        label={invoice.status === "PAGADA" ? "Pagada" : "Pendiente"}
                        color={invoice.status === "PAGADA" ? "success" : "warning"}
                        size="small"
                      />
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin factura
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1.5, border: 1, borderColor: "divider", height: "100%" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Pagos
                    </Typography>
                  </Stack>
                  {paymentSummary ? (
                    <>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: paymentSummary.remaining > 0 ? "warning.main" : "success.main" }}>
                        ${paymentSummary.totalPaid.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </Typography>
                      {paymentSummary.remaining > 0 ? (
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                          Saldo: ${paymentSummary.remaining.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </Typography>
                      ) : (
                        <Chip label="Saldado" color="success" size="small" />
                      )}
                    </>
                  ) : invoice ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin pagos registrados
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Motivo y Notas */}
      {(order.reason || order.mechanicNotes || order.clientSource) && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <NotesIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Motivo y Notas
              </Typography>
            </Stack>

            <Stack spacing={2} divider={<Divider />}>
              {order.reason && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                    Motivo de ingreso
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {order.reason}
                  </Typography>
                </Box>
              )}

              {order.clientSource && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                    Origen del cliente
                  </Typography>
                  <Typography variant="body2">
                    {order.clientSource}
                  </Typography>
                </Box>
              )}

              {order.mechanicNotes && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                    Notas del mecánico
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {order.mechanicNotes}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Historial de Trabajo */}
      {order.workHistory.length > 0 && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <HistoryIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Historial de Trabajo
              </Typography>
              <Chip
                label={`${order.workHistory.length} ${order.workHistory.length === 1 ? "registro" : "registros"}`}
                size="small"
                sx={{ ml: "auto" }}
              />
            </Stack>

            <AppDataGrid
              rows={order.workHistory.map((entry) => ({
                id: entry.repairOrderId,
                ...entry,
              }))}
              columns={columns}
              disableRowSelectionOnClick
              disableColumnMenu
              minHeight={320}
              desktopHeight="360px"
              emptyMessage="No hay historial de trabajo para mostrar."
              initialState={{
                sorting: {
                  sortModel: [{ field: "createdAt", sort: "desc" }],
                },
                pagination: {
                  paginationModel: { pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10]}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
