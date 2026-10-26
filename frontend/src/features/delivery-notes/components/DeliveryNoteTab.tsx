import { useState, useEffect, useCallback } from "react";

import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { estimatesApi } from "@/api/estimates";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import { repairOrdersApi } from "@/api/repairOrders";
import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { AttachDeliveryNoteDialog } from "./AttachDeliveryNoteDialog";
import { DeliveryNoteDetail } from "./DeliveryNoteDetail";

import { formatCurrency } from "@/utils/formatCurrency";

import type { RepairOrderDetailResponse } from "@/features/repair-orders/types";
import type { EstimateDetailResponse } from "@/types/estimate";
import type { DeliveryNoteDetailResponse } from "@/types/deliveryNote";

type EstimateState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "pending"; estimate: EstimateDetailResponse }
  | { kind: "approved"; estimate: EstimateDetailResponse }
  | { kind: "all_rejected" };

interface DeliveryNoteTabProps {
  repairOrderId: number;
}

export function DeliveryNoteTab({ repairOrderId }: DeliveryNoteTabProps) {
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetailResponse | null>(null);
  const [deliveryNoteLoading, setDeliveryNoteLoading] = useState(true);
  const [estimateState, setEstimateState] = useState<EstimateState>({ kind: "loading" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [order, setOrder] = useState<RepairOrderDetailResponse | null>(null);
  const [confirmNoEstimateOpen, setConfirmNoEstimateOpen] = useState(false);
  const [creatingWithoutEstimate, setCreatingWithoutEstimate] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setDeliveryNoteLoading(true);
    setEstimateState({ kind: "loading" });

    const [deliveryNoteRes, estimateRes, orderRes] = await Promise.allSettled([
      deliveryNotesApi.getByRepairOrderId(repairOrderId),
      estimatesApi.getByRepairOrderId(repairOrderId),
      repairOrdersApi.getById(repairOrderId),
    ]);

    setOrder(orderRes.status === "fulfilled" ? orderRes.value.data.data : null);

    if (deliveryNoteRes.status === "fulfilled") {
      setDeliveryNote(deliveryNoteRes.value.data.data);
    } else {
      setDeliveryNote(null);
    }

    if (estimateRes.status === "fulfilled") {
      const est = estimateRes.value.data.data;
      if (est.status === "ACEPTADO") {
        setEstimateState({ kind: "approved", estimate: est });
      } else if (est.status === "PENDIENTE") {
        setEstimateState({ kind: "pending", estimate: est });
      } else {
        setEstimateState({ kind: "all_rejected" });
      }
    } else {
      const allRes = await estimatesApi.getAllByRepairOrderId(repairOrderId).catch(() => null);
      const allEstimates = allRes?.data?.data ?? [];
      if (allEstimates.length > 0) {
        setEstimateState({ kind: "all_rejected" });
      } else {
        setEstimateState({ kind: "none" });
      }
    }

    setDeliveryNoteLoading(false);
  }, [repairOrderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFromEstimate = async (estimateId: number) => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await deliveryNotesApi.createFromEstimate(estimateId);
      setDeliveryNote(res.data.data);
    } catch {
      setCreateError("Error al generar la remito. Intente nuevamente.");
    } finally {
      setCreating(false);
    }
  };

  if (deliveryNoteLoading || estimateState.kind === "loading") {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (deliveryNote) {
    return (
      <Box>
        <DeliveryNoteDetail
          repairOrderId={repairOrderId}
          orderClientId={order?.clientId}
          orderClientFirstName={order?.clientFirstName}
          orderClientLastName={order?.clientLastName}
          orderClientDni={order?.clientDni}
          orderVehicleId={order?.vehicleId}
          orderVehiclePlate={order?.vehiclePlate}
          orderVehicleBrandName={order?.vehicleBrandName}
          orderVehicleModel={order?.vehicleModel}
          orderVehicleYear={order?.vehicleYear}
        />
      </Box>
    );
  }

  // Create mode is handled by DeliveryNoteDetail itself: with no delivery note loaded it
  // renders its create form bound to this order (client/vehicle prefilled and locked).
  if (creatingWithoutEstimate) {
    return (
      <Box>
        <DeliveryNoteDetail
          repairOrderId={repairOrderId}
          orderClientId={order?.clientId}
          orderClientFirstName={order?.clientFirstName}
          orderClientLastName={order?.clientLastName}
          orderClientDni={order?.clientDni}
          orderVehicleId={order?.vehicleId}
          orderVehiclePlate={order?.vehiclePlate}
          orderVehicleBrandName={order?.vehicleBrandName}
          orderVehicleModel={order?.vehicleModel}
          orderVehicleYear={order?.vehicleYear}
          onBack={() => setCreatingWithoutEstimate(false)}
          onCreated={() => fetchData()}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {createError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>
          {createError}
        </Alert>
      )}

      {estimateState.kind === "none" && (
        // Honest copy: this tab generates the remito itself, so the description must not
        // claim that an approved estimate is required first.
        <EmptyState
          icon={<ReceiptLongIcon sx={{ color: "text.disabled" }} />}
          title="Todavía no hay remito para esta orden"
          description="Podés generar el remito de esta orden de trabajo desde esta solapa."
        >
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => setConfirmNoEstimateOpen(true)}>
              Generar remito sin presupuesto
            </Button>
            {/* Only reachable while the order has no remito: the whole branch below
                renders exclusively when no delivery note is loaded for the order. */}
            {order && (
              <Button variant="outlined" onClick={() => setAttachDialogOpen(true)}>
                Asociar remito existente
              </Button>
            )}
          </Stack>
        </EmptyState>
      )}

      {estimateState.kind === "pending" && (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}
        >
          <DescriptionIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            Presupuesto pendiente de aprobación
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto", mb: 3 }}>
            Existe un presupuesto pendiente. Una vez que el cliente lo apruebe, podrá generar la
            remito desde aquí.
          </Typography>
          <EstimateSummaryCard estimate={estimateState.estimate} />
        </Paper>
      )}

      {estimateState.kind === "approved" && (
        <Paper
          elevation={0}
          sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "success.50",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <ReceiptLongIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
              Generar remito desde presupuesto aprobado
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <EstimateSummaryCard estimate={estimateState.estimate} />

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="large"
                endIcon={creating ? null : <ArrowForwardIcon />}
                onClick={() => handleCreateFromEstimate(estimateState.estimate.id)}
                disabled={creating}
              >
                {creating ? "Generando remito..." : "Generar remito"}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {estimateState.kind === "all_rejected" && (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}
        >
          <ReceiptLongIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            No hay presupuesto aprobado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto" }}>
            Todos los presupuestos anteriores fueron rechazados. Cree un nuevo presupuesto y
            apruébelo para poder generar una remito.
          </Typography>
        </Paper>
      )}

      <AppConfirmDialog
        open={confirmNoEstimateOpen}
        title="Generar remito sin presupuesto"
        message="Esta orden de trabajo no tiene un presupuesto. El remito se creará sin presupuesto y quedará vinculado a esta orden, con el cliente y el vehículo de la orden."
        confirmLabel="Generar remito"
        onConfirm={() => {
          setConfirmNoEstimateOpen(false);
          setCreatingWithoutEstimate(true);
        }}
        onCancel={() => setConfirmNoEstimateOpen(false)}
      />

      {order && (
        <AttachDeliveryNoteDialog
          open={attachDialogOpen}
          repairOrderId={repairOrderId}
          clientId={order.clientId}
          vehicleId={order.vehicleId}
          onClose={() => setAttachDialogOpen(false)}
          onAttached={() => {
            setAttachDialogOpen(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
}

function EstimateSummaryCard({ estimate }: { estimate: EstimateDetailResponse }) {
  const serviceCount = estimate.services.length;
  const productCount = estimate.products.length;

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "grey.50",
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DescriptionIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="subtitle2">
            Presupuesto #{estimate.id}
          </Typography>
        </Box>
        <Chip
          label={estimate.status === "ACEPTADO" ? "Aprobado" : "Pendiente"}
          color={estimate.status === "ACEPTADO" ? "success" : "warning"}
          size="small"
        />
      </Box>

      <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Servicios
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {serviceCount} ítem{serviceCount !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Productos
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {productCount} ítem{productCount !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
          <Typography
            variant="body1"
            fontWeight={700}
            color="primary.main"
            sx={{ textAlign: "right" }}
          >
            {estimate.total != null ? formatCurrency(estimate.total) : "—"}
          </Typography>
        </Box>
      </Stack>

      {estimate.services.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>
            Detalle de servicios
          </Typography>
          {estimate.services.map((svc) => (
            <Box key={svc.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {svc.serviceName}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, textAlign: "right" }}>
                {formatCurrency(svc.price)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {estimate.products.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>
            Detalle de productos
          </Typography>
          {estimate.products.map((prod) => (
            <Box key={prod.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {prod.productName} x{prod.quantity}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 500, textAlign: "right" }}>
                {formatCurrency(prod.totalPrice)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
