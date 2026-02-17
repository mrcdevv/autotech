import { useState, useEffect } from "react";

import {
  Box,
  TextField,
  Button,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";

import { clientsApi } from "@/api/clients";
import { vehiclesApi } from "@/api/vehicles";
import { brandsApi } from "@/api/brands";
import { vehicleTypesApi } from "@/api/vehicleTypes";
import { repairOrdersApi } from "@/api/repairOrders";
import ClientForm from "@/features/clients/components/ClientForm";
import { VehicleForm } from "@/features/vehicles/components/VehicleForm";

import type { Client } from "@/features/clients/types/client";
import type { VehicleResponse, VehicleRequest, BrandResponse, VehicleTypeResponse } from "@/types/vehicle";

interface CreateRepairOrderFormProps {
  onSuccess: () => void;
}

export function CreateRepairOrderForm({ onSuccess }: CreateRepairOrderFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResponse[]>([]);

  useEffect(() => {
    clientsApi.getAll(0, 1000).then((res) => setClients(res.data.data.content));
    brandsApi.getAll().then((res) => setBrands(res.data.data));
    vehicleTypesApi.getAll().then((res) => setVehicleTypes(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      vehiclesApi.getByClient(selectedClientId).then((res) => setVehicles(res.data.data));
    } else {
      setVehicles([]);
    }
    setSelectedVehicleId(null);
  }, [selectedClientId]);

  const handleSubmit = async () => {
    if (!selectedClientId || !selectedVehicleId) return;
    setSubmitting(true);
    setError(null);
    try {
      await repairOrdersApi.create({
        clientId: selectedClientId,
        vehicleId: selectedVehicleId,
        reason: reason || null,
      });
      onSuccess();
    } catch {
      setError("Error al crear la orden de trabajo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveVehicle = async (data: VehicleRequest) => {
    const res = await vehiclesApi.create({ ...data, clientId: selectedClientId! });
    const newVehicle = res.data.data;
    setVehicles((prev) => [...prev, newVehicle]);
    setSelectedVehicleId(newVehicle.id);
    setVehicleModalOpen(false);
  };

  const handleCreateBrand = async (name: string): Promise<BrandResponse> => {
    const res = await brandsApi.create({ name });
    const newBrand = res.data.data;
    setBrands((prev) => [...prev, newBrand]);
    return newBrand;
  };

  return (
    <Box sx={{ maxWidth: 600, mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Autocomplete
          options={clients}
          getOptionLabel={(c) => `${c.firstName} ${c.lastName} — ${c.dni || "Sin DNI"}`}
          onChange={(_, value) => setSelectedClientId(value?.id ?? null)}
          renderInput={(params) => <TextField {...params} label="Cliente" required />}
          fullWidth
        />
        <Button variant="outlined" onClick={() => setClientModalOpen(true)}>
          Nuevo cliente
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Autocomplete
          options={vehicles}
          getOptionLabel={(v) =>
            `${[v.year, v.brandName, v.model].filter(Boolean).join(" ")} — ${v.plate}`
          }
          onChange={(_, value) => setSelectedVehicleId(value?.id ?? null)}
          value={vehicles.find((v) => v.id === selectedVehicleId) || null}
          disabled={!selectedClientId}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Vehículo"
              required
              helperText={!selectedClientId ? "Seleccione un cliente primero" : ""}
            />
          )}
          fullWidth
        />
        <Button
          variant="outlined"
          disabled={!selectedClientId}
          onClick={() => setVehicleModalOpen(true)}
        >
          Nuevo vehículo
        </Button>
      </Box>

      <TextField
        label="Motivo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        multiline
        rows={4}
        fullWidth
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 5000 }}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!selectedClientId || !selectedVehicleId || submitting}
        fullWidth
      >
        {submitting ? <CircularProgress size={24} /> : "Crear orden de trabajo"}
      </Button>

      {clientModalOpen && (
        <ClientForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          client={null}
          onSuccess={() => setClientModalOpen(false)}
          onClientCreated={(newClient) => {
            setClients((prev) => [...prev, newClient]);
            setSelectedClientId(newClient.id);
          }}
        />
      )}

      {vehicleModalOpen && selectedClientId && (
        <VehicleForm
          open={vehicleModalOpen}
          onClose={() => setVehicleModalOpen(false)}
          onSave={handleSaveVehicle}
          onCreateBrand={handleCreateBrand}
          brands={brands}
          vehicleTypes={vehicleTypes}
        />
      )}
    </Box>
  );
}
