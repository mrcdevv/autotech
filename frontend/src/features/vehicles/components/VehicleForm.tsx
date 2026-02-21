import { useState, useEffect, useCallback } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Autocomplete,
  createFilterOptions,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useNavigate } from "react-router";

import { clientAutocompleteApi } from "@/api/clientAutocomplete";

import type {
  VehicleResponse,
  VehicleRequest,
  BrandResponse,
  VehicleTypeResponse,
  ClientAutocompleteResponse,
} from "@/types/vehicle";

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: VehicleRequest) => Promise<void>;
  onCreateBrand: (name: string) => Promise<BrandResponse>;
  initialData?: VehicleResponse | null;
  brands: BrandResponse[];
  vehicleTypes: VehicleTypeResponse[];
}

interface FormErrors {
  [key: string]: string;
}

interface BrandOption extends BrandResponse {
  inputValue?: string;
}

const brandFilter = createFilterOptions<BrandOption>();

const NEW_CLIENT_ID = -1;

export function VehicleForm({
  open,
  onClose,
  onSave,
  onCreateBrand,
  initialData,
  brands,
  vehicleTypes,
}: VehicleFormProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState<VehicleRequest>({
    clientId: 0,
    plate: "",
    chassisNumber: null,
    engineNumber: null,
    brandId: null,
    model: null,
    year: null,
    vehicleTypeId: null,
    observations: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const [clients, setClients] = useState<ClientAutocompleteResponse[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientInputValue, setClientInputValue] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientAutocompleteResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeResponse | null>(null);

  const fetchClients = useCallback(async (query?: string) => {
    setClientsLoading(true);
    try {
      const res = await clientAutocompleteApi.search(query);
      setClients(res.data.data);
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchClients();
      if (initialData) {
        setForm({
          clientId: initialData.clientId,
          plate: initialData.plate,
          chassisNumber: initialData.chassisNumber,
          engineNumber: initialData.engineNumber,
          brandId: initialData.brandId,
          model: initialData.model,
          year: initialData.year,
          vehicleTypeId: initialData.vehicleTypeId,
          observations: initialData.observations,
        });
        setSelectedClient({
          id: initialData.clientId,
          firstName: initialData.clientFirstName,
          lastName: initialData.clientLastName,
          dni: initialData.clientDni,
        });
        setSelectedBrand(
          initialData.brandId
            ? brands.find((b) => b.id === initialData.brandId) ?? null
            : null,
        );
        setSelectedVehicleType(
          initialData.vehicleTypeId
            ? vehicleTypes.find((vt) => vt.id === initialData.vehicleTypeId) ?? null
            : null,
        );
      } else {
        setForm({
          clientId: 0,
          plate: "",
          chassisNumber: null,
          engineNumber: null,
          brandId: null,
          model: null,
          year: null,
          vehicleTypeId: null,
          observations: null,
        });
        setSelectedClient(null);
        setSelectedBrand(null);
        setSelectedVehicleType(null);
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [open, initialData, brands, vehicleTypes, fetchClients]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchClients(clientInputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientInputValue, open, fetchClients]);

  const handleChange = (field: keyof VehicleRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.clientId || form.clientId === 0) {
      newErrors.clientId = "El cliente es obligatorio";
    }
    if (!form.plate.trim()) {
      newErrors.plate = "La patente es obligatoria (ej. AB123CD)";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/.test(form.plate.trim())) {
      newErrors.plate = "La patente debe contener obligatoriamente letras y números, sin espacios (ej. AD123CF o AA111AA)";
    }
    if (!form.brandId) {
      newErrors.brandId = "La marca es obligatoria";
    }
    if (!form.model || !form.model.trim()) {
      newErrors.model = "El modelo es obligatorio";
    }
    if (!form.vehicleTypeId) {
      newErrors.vehicleTypeId = "El tipo de vehículo es obligatorio";
    }

    if (form.year === null || form.year === undefined || form.year.toString() === "") {
      newErrors.year = "El año es obligatorio";
    } else {
      const currentYear = new Date().getFullYear();
      if (form.year < 1950 || form.year > currentYear) {
        newErrors.year = `El año debe ser entre 1950 y ${currentYear} (ej. 2018)`;
      }
    }

    if (form.chassisNumber && !/^[A-Za-z0-9]+$/.test(form.chassisNumber)) {
      newErrors.chassisNumber = "El chasis solo debe contener letras y números (ej. 8C3V...)";
    }
    if (form.engineNumber && !/^[A-Za-z0-9]+$/.test(form.engineNumber)) {
      newErrors.engineNumber = "El motor solo debe contener letras y números (ej. M20B...)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSave(form);
    }
  };

  const handleClientChange = (_e: unknown, value: ClientAutocompleteResponse | null) => {
    if (value && value.id === NEW_CLIENT_ID) return;
    setSelectedClient(value);
    handleChange("clientId", value?.id ?? 0);
  };

  const handleBrandChange = async (_e: unknown, value: BrandOption | string | null) => {
    if (typeof value === "string") {
      const created = await onCreateBrand(value);
      setSelectedBrand(created);
      handleChange("brandId", created.id);
    } else if (value && "inputValue" in value && value.inputValue) {
      const created = await onCreateBrand(value.inputValue);
      setSelectedBrand(created);
      handleChange("brandId", created.id);
    } else {
      setSelectedBrand(value as BrandOption | null);
      handleChange("brandId", value ? (value as BrandOption).id : null);
    }
  };

  const clientOptions: ClientAutocompleteResponse[] = [
    ...clients,
    { id: NEW_CLIENT_ID, firstName: "+", lastName: "Nuevo Cliente", dni: null },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={clientOptions}
                getOptionLabel={(option) =>
                  option.id === NEW_CLIENT_ID
                    ? "+ Nuevo Cliente"
                    : `${option.firstName} ${option.lastName}${option.dni ? ` (${option.dni})` : ""}`
                }
                value={selectedClient}
                onChange={handleClientChange}
                inputValue={clientInputValue}
                onInputChange={(_e, value) => setClientInputValue(value)}
                loading={clientsLoading}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderOption={(props, option) => {
                  if (option.id === NEW_CLIENT_ID) {
                    return (
                      <li
                        {...props}
                        key="new-client"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate("/clientes");
                        }}
                        style={{ ...props.style, fontWeight: 600, color: "#1565C0" }}
                      >
                        + Nuevo Cliente
                      </li>
                    );
                  }
                  return (
                    <li {...props} key={option.id}>
                      {`${option.firstName} ${option.lastName}${option.dni ? ` (${option.dni})` : ""}`}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                    error={!!errors.clientId}
                    helperText={errors.clientId}
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
              <TextField
                fullWidth
                label="Patente"
                placeholder="Ej. AB123CD o AD123CF"
                value={form.plate}
                onChange={(e) => handleChange("plate", e.target.value)}
                error={!!errors.plate}
                helperText={errors.plate}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="N° Chasis"
                placeholder="Ej. 8C3V..."
                value={form.chassisNumber ?? ""}
                onChange={(e) => handleChange("chassisNumber", e.target.value || null)}
                error={!!errors.chassisNumber}
                helperText={errors.chassisNumber}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="N° Motor"
                placeholder="Ej. M20B..."
                value={form.engineNumber ?? ""}
                onChange={(e) => handleChange("engineNumber", e.target.value || null)}
                error={!!errors.engineNumber}
                helperText={errors.engineNumber}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={brands as BrandOption[]}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.name
                }
                value={selectedBrand}
                onChange={handleBrandChange}
                filterOptions={(options, params) => {
                  const filtered = brandFilter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some(
                    (option) => inputValue.toLowerCase() === option.name.toLowerCase(),
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push({
                      inputValue,
                      id: 0,
                      name: `Agregar "${inputValue}"`,
                      createdAt: "",
                    });
                  }
                  return filtered;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Marca"
                    required
                    error={!!errors.brandId}
                    helperText={errors.brandId}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Modelo"
                placeholder="Ej. Hilux, Focus"
                value={form.model ?? ""}
                onChange={(e) => handleChange("model", e.target.value || null)}
                required
                error={!!errors.model}
                helperText={errors.model}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Año"
                type="number"
                placeholder="Ej. 2018"
                value={form.year ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("year", val === "" ? null : parseInt(val, 10));
                }}
                required
                error={!!errors.year}
                helperText={errors.year}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={vehicleTypes}
                getOptionLabel={(option) => option.name}
                value={selectedVehicleType}
                onChange={(_e, value) => {
                  setSelectedVehicleType(value);
                  handleChange("vehicleTypeId", value?.id ?? null);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de vehículo"
                    required
                    error={!!errors.vehicleTypeId}
                    helperText={errors.vehicleTypeId}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observaciones"
                value={form.observations ?? ""}
                onChange={(e) => handleChange("observations", e.target.value || null)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isDirty}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
