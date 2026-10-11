import { useState, useEffect, useMemo } from "react";

import { Alert, Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";

import { AppDialog } from "@/components/AppDialog";
import { repairOrdersApi } from "@/api/repairOrders";

import { useMechanics } from "../hooks/useMechanics";

import type { EmployeeSummary } from "../types";

interface AssignMechanicsDialogProps {
  open: boolean;
  orderId: number;
  assigned: EmployeeSummary[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignMechanicsDialog({
  open,
  orderId,
  assigned,
  onClose,
  onSuccess,
}: AssignMechanicsDialogProps) {
  const { mechanics, loading } = useMechanics(open);
  const [selected, setSelected] = useState<EmployeeSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(assigned.map((emp) => ({ id: emp.id, firstName: emp.firstName, lastName: emp.lastName })));
      setError(null);
    }
  }, [open, assigned]);

  // Keep currently assigned mechanics selectable even if they no longer hold the role.
  const options = useMemo(() => {
    const byId = new Map<number, EmployeeSummary>();
    mechanics.forEach((emp) => byId.set(emp.id, { id: emp.id, firstName: emp.firstName, lastName: emp.lastName }));
    assigned.forEach((emp) => {
      if (!byId.has(emp.id)) {
        byId.set(emp.id, { id: emp.id, firstName: emp.firstName, lastName: emp.lastName });
      }
    });
    return [...byId.values()];
  }, [mechanics, assigned]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await repairOrdersApi.assignEmployees(
        orderId,
        selected.map((emp) => emp.id),
      );
      onSuccess();
      onClose();
    } catch {
      setError("Error al asignar los mecánicos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Asignar mecánicos"
      subtitle={`Orden de trabajo #${orderId}`}
      maxWidth="xs"
      iconTone="info"
      icon={<EngineeringOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ pt: 0.5, minHeight: 200 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Autocomplete
          multiple
          options={options}
          value={selected}
          onChange={(_event, value) => setSelected(value)}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={loading}
          noOptionsText="No hay mecánicos activos"
          slotProps={{ popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } }}
          renderInput={(params) => (
            <TextField {...params} label="Mecánicos" placeholder="Seleccioná los mecánicos" />
          )}
        />

        <Typography variant="caption" color="text.secondary">
          Solo se listan empleados activos con rol MECANICO. Podés asignar varios.
        </Typography>
      </Stack>
    </AppDialog>
  );
}
