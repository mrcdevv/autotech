import { useState, useEffect, useCallback } from "react";

import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { clientsApi } from "@/api/clients";
import { vehiclesApi } from "@/api/vehicles";
import { employeesApi } from "@/api/employees";
import { tagsApi } from "@/api/tags";

import type { Dayjs } from "dayjs";
import type { AppointmentRequest, VehicleDeliveryMethod, TagResponse } from "@/types/appointment";
import type { Client } from "@/features/clients/types/client";
import type { VehicleResponse } from "@/types/vehicle";
import type { EmployeeResponse } from "@/features/employees/types";

interface AppointmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AppointmentRequest) => Promise<void>;
  defaultDurationMinutes: number;
}

export function AppointmentFormDialog({
  open,
  onClose,
  onSave,
  defaultDurationMinutes,
}: AppointmentFormDialogProps) {
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicleDeliveryMethod, setVehicleDeliveryMethod] = useState<VehicleDeliveryMethod | "">("");
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeResponse[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagResponse[]>([]);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);

  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const res = await clientsApi.getAll(0, 100);
      setClients(res.data.data.content);
    } catch { /* ignored */ } finally {
      setClientsLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeesApi.getAll(0, 100);
      setEmployees(res.data.data.content);
    } catch { /* ignored */ }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagsApi.getAll();
      setTags(res.data.data);
    } catch { /* ignored */ }
  }, []);

  useEffect(() => {
    if (open) {
      const now = dayjs();
      const roundedMinute = Math.ceil(now.minute() / 30) * 30;
      const roundedStart = now.minute(roundedMinute).second(0).millisecond(0);
      setStartTime(roundedStart);
      setEndTime(roundedStart.add(defaultDurationMinutes, "minute"));
      setSelectedClient(null);
      setSelectedVehicle(null);
      setTitle("");
      setPurpose("");
      setVehicleDeliveryMethod("");
      setSelectedEmployees([]);
      setSelectedTags([]);
      setVehicles([]);

      fetchClients();
      fetchEmployees();
      fetchTags();
    }
  }, [open, defaultDurationMinutes, fetchClients, fetchEmployees, fetchTags]);

  useEffect(() => {
    if (selectedClient) {
      setVehiclesLoading(true);
      vehiclesApi.getByClient(selectedClient.id)
        .then((res) => setVehicles(res.data.data))
        .catch(() => setVehicles([]))
        .finally(() => setVehiclesLoading(false));
    } else {
      setVehicles([]);
      setSelectedVehicle(null);
    }
  }, [selectedClient]);

  const handleClientChange = (_e: unknown, value: Client | null) => {
    setSelectedClient(value);
    setSelectedVehicle(null);
  };

  const handleSave = async () => {
    if (!startTime || !endTime) return;
    setSaving(true);
    try {
      await onSave({
        title: title || null,
        clientId: selectedClient?.id ?? null,
        vehicleId: selectedVehicle?.id ?? null,
        purpose: purpose || null,
        startTime: startTime.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: endTime.format("YYYY-MM-DDTHH:mm:ss"),
        vehicleDeliveryMethod: vehicleDeliveryMethod || null,
        employeeIds: selectedEmployees.map((e) => e.id),
        tagIds: selectedTags.map((t) => t.id),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const titlePlaceholder =
    selectedClient && selectedVehicle
      ? `Cita - ${selectedClient.firstName} ${selectedClient.lastName} - ${selectedVehicle.plate}`
      : selectedClient
        ? `Cita - ${selectedClient.firstName} ${selectedClient.lastName}`
        : "Título de la cita";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Nueva cita</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimePicker
                  label="Inicio"
                  value={startTime}
                  onChange={(v) => {
                    setStartTime(v);
                    if (v && (!endTime || v.isAfter(endTime))) {
                      setEndTime(v.add(defaultDurationMinutes, "minute"));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  ampm={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimePicker
                  label="Fin"
                  value={endTime}
                  onChange={setEndTime}
                  minDateTime={startTime ?? undefined}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  ampm={false}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(o) => `${o.firstName} ${o.lastName}${o.dni ? ` (${o.dni})` : ""}`}
                  value={selectedClient}
                  onChange={handleClientChange}
                  loading={clientsLoading}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {clientsLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={vehicles}
                  getOptionLabel={(o) =>
                    `${o.plate}${o.brandName ? ` - ${o.brandName}` : ""}${o.model ? ` ${o.model}` : ""}`
                  }
                  value={selectedVehicle}
                  onChange={(_e, v) => setSelectedVehicle(v)}
                  disabled={!selectedClient}
                  loading={vehiclesLoading}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehículo"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {vehiclesLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {selectedClient && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre completo"
                      value={`${selectedClient.firstName} ${selectedClient.lastName}`}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={selectedClient.phone}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                </>
              )}

              {selectedVehicle && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Patente"
                      value={selectedVehicle.plate}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Marca"
                      value={selectedVehicle.brandName ?? ""}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Modelo"
                      value={selectedVehicle.model ?? ""}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Grid>
                </>
              )}

              <Grid size={12}>
                <Autocomplete
                  multiple
                  options={tags}
                  getOptionLabel={(o) => o.name}
                  value={selectedTags}
                  onChange={(_e, v) => setSelectedTags(v)}
                  readOnly={tags.length === 0}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Etiquetas" />
                  )}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={titlePlaceholder}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Propósito / Descripción"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  multiple
                  options={employees}
                  getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                  value={selectedEmployees}
                  onChange={(_e, v) => setSelectedEmployees(v)}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Empleados" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Método de entrega del vehículo</InputLabel>
                  <Select
                    value={vehicleDeliveryMethod}
                    label="Método de entrega del vehículo"
                    onChange={(e) => setVehicleDeliveryMethod(e.target.value as VehicleDeliveryMethod | "")}
                  >
                    <MenuItem value="">(Ninguno)</MenuItem>
                    <MenuItem value="PROPIO">Propio</MenuItem>
                    <MenuItem value="GRUA">Grúa</MenuItem>
                    <MenuItem value="TERCERO">Tercero</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !startTime || !endTime}>
          {saving ? <CircularProgress size={24} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
