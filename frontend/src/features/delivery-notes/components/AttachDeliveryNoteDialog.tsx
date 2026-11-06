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

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppDialog } from "@/components/AppDialog";
import { deliveryNotesApi } from "@/api/deliveryNotes";

import type { DeliveryNoteResponse } from "@/types/deliveryNote";

function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (data.message) return data.message;
  }
  return "Ocurrió un error inesperado";
}

interface AttachDeliveryNoteDialogProps {
  open: boolean;
  repairOrderId: number;
  /** Order's client: the identity filter for the candidate request. */
  clientId: number;
  /** Order's vehicle (may be null). Remitos with no vehicle are still valid candidates. */
  vehicleId: number | null;
  onClose: () => void;
  onAttached: () => void;
}

export function AttachDeliveryNoteDialog({
  open,
  repairOrderId,
  clientId,
  vehicleId,
  onClose,
  onAttached,
}: AttachDeliveryNoteDialogProps) {
  const [notes, setNotes] = useState<DeliveryNoteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  // Candidates are requested with the clientId identity filter only. The backend's
  // vehicleId filter is an exact match that silently drops remitos with no vehicle,
  // so the vehicle nuance is applied here: keep remitos without a vehicle and remitos
  // whose vehicle matches the order's, and drop those attached to another order
  // (the endpoint would refuse them anyway).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedId(null);
    setRefusal(null);
    deliveryNotesApi
      .getAll({ clientId, size: 50 })
      .then((res) => {
        if (cancelled) return;
        const candidates = res.data.data.content.filter(
          (n) =>
            n.repairOrderId == null && (n.vehicleId == null || n.vehicleId === vehicleId),
        );
        setNotes(candidates);
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudieron cargar los remitos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, vehicleId]);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const handleAttach = async () => {
    if (selectedId == null) return;
    setAttaching(true);
    setRefusal(null);
    try {
      await deliveryNotesApi.attachToRepairOrder(selectedId, repairOrderId);
      onAttached();
    } catch (err) {
      setRefusal(extractApiError(err));
      setConfirmOpen(false);
    } finally {
      setAttaching(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={attaching ? () => undefined : onClose}
      title="Asociar remito existente"
      subtitle="Elegí el remito de este cliente que querés asociar a la orden de trabajo."
      icon={<LinkIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={attaching}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedId == null || attaching}
          >
            Asociar
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
      ) : notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2}>
          No hay remitos disponibles para asociar a esta orden.
        </Typography>
      ) : (
        <List disablePadding>
          {notes.map((n) => (
            <ListItemButton
              key={n.id}
              selected={selectedId === n.id}
              onClick={() => setSelectedId(n.id)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={`Remito #${n.number}`}
                secondary={
                  n.vehicleId == null
                    ? "Sin vehículo"
                    : `${n.vehiclePlate}${n.vehicleModel ? ` - ${n.vehicleModel}` : ""}`
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}

      <AppConfirmDialog
        open={confirmOpen}
        title="Asociar remito a esta orden"
        message={
          selectedNote
            ? `El remito #${selectedNote.number} quedará asociado a esta orden de trabajo. Los montos y los pagos del remito no cambian: solo se registra que corresponden a esta orden.`
            : ""
        }
        confirmLabel="Asociar remito"
        loading={attaching}
        onConfirm={handleAttach}
        onCancel={() => setConfirmOpen(false)}
      >
        {selectedNote?.status === "PAGADA" && (
          <Alert severity="warning">
            Este remito ya está pagado. Al asociarlo, esta orden se considera cobrada, aunque el
            pago se haya hecho antes.
          </Alert>
        )}
      </AppConfirmDialog>
    </AppDialog>
  );
}
