import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import axios from "axios";

import { AppDialog } from "@/components/AppDialog";
import { estimatesApi } from "@/api/estimates";
import { repairOrdersApi } from "@/api/repairOrders";

import type { RepairOrderResponse } from "@/features/repair-orders/types";

function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (data.message) return data.message;
  }
  return "Ocurrió un error inesperado";
}

interface AttachRepairOrderDialogProps {
  open: boolean;
  estimateId: number;
  clientId: number;
  vehicleId: number | null;
  onClose: () => void;
  onAttached: () => void;
}

export function AttachRepairOrderDialog({
  open,
  estimateId,
  clientId,
  vehicleId,
  onClose,
  onAttached,
}: AttachRepairOrderDialogProps) {
  const [orders, setOrders] = useState<RepairOrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  // Candidates are always scoped to the estimate's client (and vehicle when it has one);
  // the backend endpoint would refuse anything else anyway, so the picker only ever
  // offers orders it would accept.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedId(null);
    setRefusal(null);
    repairOrdersApi
      .search({ clientId, ...(vehicleId != null ? { vehicleId } : {}) })
      .then((res) => {
        if (!cancelled) setOrders(res.data.data.content);
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudieron cargar las órdenes de trabajo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, vehicleId]);

  const handleAttach = async () => {
    if (selectedId == null) return;
    setAttaching(true);
    setRefusal(null);
    try {
      await estimatesApi.attachToRepairOrder(estimateId, selectedId);
      onAttached();
    } catch (err) {
      setRefusal(extractApiError(err));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={attaching ? () => undefined : onClose}
      title="Asociar a una orden de trabajo"
      subtitle="Elegí la orden de trabajo del mismo cliente a la que se asociará este presupuesto."
      icon={<LinkIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={attaching}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAttach}
            disabled={selectedId == null || attaching}
          >
            {attaching ? "Asociando..." : "Asociar"}
          </Button>
        </>
      }
    >
      {refusal && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {refusal}
        </Alert>
      )}

      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2}>
          No hay órdenes de trabajo para este cliente.
        </Typography>
      ) : (
        <List disablePadding>
          {orders.map((o) => (
            <ListItemButton
              key={o.id}
              selected={selectedId === o.id}
              onClick={() => setSelectedId(o.id)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={`Orden #${o.id}${o.title ? ` · ${o.title}` : ""}`}
                secondary={`${o.vehiclePlate}${o.vehicleModel ? ` - ${o.vehicleModel}` : ""}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </AppDialog>
  );
}
