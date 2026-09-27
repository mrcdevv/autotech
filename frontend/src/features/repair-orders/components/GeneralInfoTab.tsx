import { useState, useEffect } from "react";

import {
  Box,
  Typography,
  CircularProgress,
  Link,
  Stack,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  Divider,
  LinearProgress,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import { AssignMechanicsDialog } from "./AssignMechanicsDialog";
import { estimatesApi } from "@/api/estimates";
import { invoicesApi } from "@/api/invoices";
import { paymentsApi } from "@/api/payments";
import { AppDataGrid } from "@/components/AppDataGrid";
import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";

import type { GridColDef } from "@mui/x-data-grid";
import type { ReactNode } from "react";
import type { RepairOrderDetailResponse } from "../types";
import type { EstimateResponse } from "@/types/estimate";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { PaymentSummaryResponse } from "@/types/payment";
import { STATUS_META } from "../statusMeta";

interface GeneralInfoTabProps {
  order: RepairOrderDetailResponse | null;
  loading: boolean;
  onRefetch: () => void;
}

export function GeneralInfoTab({ order, loading, onRefetch }: GeneralInfoTabProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
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

  const meta = STATUS_META[order.status];
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
      renderCell: (params) => (
        <MonoText>{new Date(params.value).toLocaleDateString("es-AR")}</MonoText>
      ),
      sortable: true,
    },
    {
      field: "repairOrderId",
      headerName: "Orden de Trabajo",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Link href={`/ordenes-trabajo/${params.value}`} underline="hover" sx={{ fontWeight: 500 }}>
          <MonoText>OT-{params.value}</MonoText>
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
    <>
      <Stack spacing={2} sx={{ py: 3 }}>
      {/* Estado y seguimiento */}
      <Panel title="Estado y seguimiento">
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={{ xs: 2, sm: 3.5 }}>
          <InfoBlock label="Estado">
            <StatusBadge tone={meta.tone} label={meta.label} />
          </InfoBlock>

          <InfoBlock label="Fecha de ingreso">
            <MonoText sx={{ fontSize: "0.8125rem" }}>{createdDate.toLocaleDateString("es-AR")}</MonoText>
          </InfoBlock>

          <InfoBlock label="Días en taller">
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: daysInShop > 7 ? "warning.main" : "text.primary" }}
            >
              {daysInShop} {daysInShop === 1 ? "día" : "días"}
            </Typography>
          </InfoBlock>

          <InfoBlock label="Mecánicos asignados">
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {order.employees.length > 0 ? (
                <AvatarGroup max={4} sx={{ justifyContent: "flex-start" }}>
                  {order.employees.map((emp) => (
                    <Tooltip key={emp.id} title={`${emp.firstName} ${emp.lastName}`}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.main" }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin asignar
                </Typography>
              )}
              <Button
                size="small"
                startIcon={<PersonAddAltOutlinedIcon />}
                onClick={() => setAssignDialogOpen(true)}
              >
                {order.employees.length > 0 ? "Editar" : "Asignar"}
              </Button>
            </Stack>
          </InfoBlock>

          {order.tags.length > 0 && (
            <InfoBlock label="Etiquetas">
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
            </InfoBlock>
          )}
        </Stack>
      </Panel>

      {/* Resumen Financiero */}
      <Panel title="Resumen Financiero">
        {financialLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1.5, border: 1, borderColor: "divider", height: "100%" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Presupuesto
                </Typography>
                {activeEstimate ? (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      <MonoText>
                        {activeEstimate.total != null ? formatCurrency(activeEstimate.total) : "—"}
                      </MonoText>
                    </Typography>
                    <StatusBadge
                      tone={activeEstimate.status === "ACEPTADO" ? "ok" : "warn"}
                      label={activeEstimate.status === "ACEPTADO" ? "Aprobado" : "Pendiente"}
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
                    <StatusBadge
                      tone="bad"
                      label={`${rejectedCount} rechazado${rejectedCount > 1 ? "s" : ""}`}
                    />
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
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Factura
                </Typography>
                {invoice ? (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      <MonoText>{invoice.total != null ? formatCurrency(invoice.total) : "—"}</MonoText>
                    </Typography>
                    <StatusBadge
                      tone={invoice.status === "PAGADA" ? "ok" : "warn"}
                      label={invoice.status === "PAGADA" ? "Pagada" : "Pendiente"}
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
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Pagos
                </Typography>
                {paymentSummary ? (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      <MonoText>{formatCurrency(paymentSummary.totalPaid)}</MonoText>
                    </Typography>
                    {paymentSummary.remaining > 0 ? (
                      <Typography variant="body2" sx={{ color: "status.bad.fg", fontWeight: 500 }}>
                        Saldo: <MonoText>{formatCurrency(paymentSummary.remaining)}</MonoText>
                      </Typography>
                    ) : (
                      <StatusBadge tone="ok" label="Saldado" />
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
      </Panel>

      {/* Motivo y Notas */}
      {(order.reason || order.mechanicNotes || order.clientSource) && (
        <Panel title="Motivo y Notas">
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
        </Panel>
      )}

      {/* Historial de Trabajo */}
      {order.workHistory.length > 0 && (
        <Panel
          title="Historial de Trabajo"
          action={
            <StatusBadge
              tone="neutral"
              label={`${order.workHistory.length} ${order.workHistory.length === 1 ? "registro" : "registros"}`}
            />
          }
        >
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
        </Panel>
      )}
      </Stack>

      {order && (
        <AssignMechanicsDialog
          open={assignDialogOpen}
          orderId={order.id}
          assigned={order.employees}
          onClose={() => setAssignDialogOpen(false)}
          onSuccess={onRefetch}
        />
      )}
    </>
  );
}

interface InfoBlockProps {
  label: string;
  children: ReactNode;
}

function InfoBlock({ label, children }: InfoBlockProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}
