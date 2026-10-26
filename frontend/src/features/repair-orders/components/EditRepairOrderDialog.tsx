import { useEffect, useState } from "react";

import { Alert, Autocomplete, Box, Button, Stack, TextField, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { AppDialog } from "@/components/AppDialog";
import { repairOrdersApi } from "@/api/repairOrders";
import { tagsApi } from "@/api/tags";

import type { RepairOrderDetailResponse, TagResponse } from "../types";

interface EditRepairOrderDialogProps {
  open: boolean;
  order: RepairOrderDetailResponse;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRepairOrderDialog({ open, order, onClose, onSuccess }: EditRepairOrderDialogProps) {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [mechanicNotes, setMechanicNotes] = useState("");
  const [clientSource, setClientSource] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason(order.reason ?? "");
    setMechanicNotes(order.mechanicNotes ?? "");
    setClientSource(order.clientSource ?? "");
    setSelectedTags([...order.tags]);
    setError(null);
  }, [open, order]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTagsLoading(true);
    tagsApi
      .getAll()
      .then((res) => {
        if (!cancelled) setTags(res.data.data);
      })
      .catch(() => {
        // Tags are optional in the edit; leave the list empty on failure.
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // PUT /{id} overwrites every field it receives, so the payload must be a
      // faithful round-trip: client, vehicle, appointment and mechanics are sent
      // back exactly as they were read, or they would be wiped on the server.
      await repairOrdersApi.update(order.id, {
        clientId: order.clientId,
        vehicleId: order.vehicleId,
        appointmentId: order.appointmentId,
        reason: reason || null,
        mechanicNotes: mechanicNotes || null,
        clientSource: clientSource || null,
        employeeIds: order.employees.map((emp) => emp.id),
        tagIds: selectedTags.map((tag) => tag.id),
      });
      onSuccess();
      onClose();
    } catch {
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Editar orden de trabajo"
      subtitle={`Orden de trabajo #${order.id}`}
      maxWidth="sm"
      iconTone="info"
      icon={<EditOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || tagsLoading}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Client and vehicle are immutable after creation: shown read-only. */}
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
              Cliente
            </Typography>
            <Typography variant="body2">
              {order.clientFirstName} {order.clientLastName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
              Vehículo
            </Typography>
            <Typography variant="body2">
              {[
                order.vehicleBrandName,
                order.vehicleModel,
                order.vehicleYear,
                `· ${order.vehiclePlate}`,
              ]
                .filter((part) => part !== null && part !== undefined && part !== "")
                .join(" ")}
            </Typography>
          </Box>
        </Stack>

        <TextField
          label="Motivo de ingreso"
          multiline
          minRows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <TextField
          label="Notas del mecánico"
          multiline
          minRows={2}
          value={mechanicNotes}
          onChange={(event) => setMechanicNotes(event.target.value)}
        />

        <TextField
          label="Origen del cliente"
          value={clientSource}
          onChange={(event) => setClientSource(event.target.value)}
        />

        <Autocomplete
          multiple
          options={tags}
          value={selectedTags}
          onChange={(_event, value) => setSelectedTags(value)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={tagsLoading}
          noOptionsText="No hay etiquetas"
          slotProps={{ popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } }}
          renderInput={(params) => (
            <TextField {...params} label="Etiquetas" placeholder="Seleccioná las etiquetas" />
          )}
        />
      </Stack>
    </AppDialog>
  );
}
