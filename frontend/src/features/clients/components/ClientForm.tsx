import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { clientsApi } from "@/api/clients";
import type { Client, ClientRequest, ClientType } from "@/features/clients/types/client";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: (client: Client) => void;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM: ClientRequest = {
  firstName: "",
  lastName: "",
  dni: "",
  commercialName: "",
  email: "",
  phone: "",
  address: "",
  province: "",
  country: "",
  clientType: "PERSONAL",
  entryDate: new Date().toISOString().split("T")[0],
};

export default function ClientForm({ open, onClose, client, onSuccess }: ClientFormProps) {
  const [form, setForm] = useState<ClientRequest>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (client) {
        setForm({
          firstName: client.firstName,
          lastName: client.lastName,
          dni: client.dni ?? "",
          commercialName: client.commercialName ?? "",
          email: client.email ?? "",
          phone: client.phone,
          address: client.address ?? "",
          province: client.province ?? "",
          country: client.country ?? "",
          clientType: client.clientType,
          entryDate: client.entryDate ?? new Date().toISOString().split("T")[0],
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
      setIsFormValid(false);
      setApiError(null);
    }
  }, [client, open]);

  const isFormComplete = (formToValidate: ClientRequest) => {
    const commonFields = 
      formToValidate.firstName.trim() !== "" &&
      formToValidate.lastName.trim() !== "" &&
      formToValidate.phone.trim() !== "";
    
    if (formToValidate.clientType === "TEMPORAL") {
      return commonFields;
    }

    return (
      commonFields &&
      formToValidate.dni?.trim() !== "" &&
      formToValidate.address?.trim() !== "" &&
      formToValidate.province?.trim() !== "" &&
      formToValidate.country?.trim() !== ""
    );
  };

  const validate = (formToValidate: ClientRequest): boolean => {
    const newErrors: FormErrors = {};

    if (!formToValidate.firstName.trim()) newErrors.firstName = "El nombre es obligatorio";
    if (!formToValidate.lastName.trim()) newErrors.lastName = "El apellido es obligatorio";
    if (!formToValidate.phone.trim()) newErrors.phone = "El teléfono es obligatorio";

    if (formToValidate.clientType !== "TEMPORAL") {
      if (!formToValidate.dni?.trim()) {
        newErrors.dni = "El DNI es obligatorio";
      } else if (!/^[0-9]{8}$/.test(formToValidate.dni)) {
        newErrors.dni = "El DNI debe contener 8 dígitos numéricos";
      }
      if (!formToValidate.address?.trim()) newErrors.address = "La dirección es obligatoria";
      if (!formToValidate.province?.trim()) newErrors.province = "La provincia es obligatoria";
      if (!formToValidate.country?.trim()) newErrors.country = "El país es obligatorio";
    }

    if (formToValidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formToValidate.email)) {
      newErrors.email = "El formato del correo electrónico no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isFormComplete(formToValidate);
  };

  const handleChange = (field: keyof ClientRequest, value: unknown) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setIsFormValid(validate(newForm));
  };

  const handleLetterInputChange = (field: keyof ClientRequest, value: string) => {
    const filteredValue = value.replace(/[^a-zA-Z\u00C0-\u017F\s]/g, "");
    handleChange(field, filteredValue);
  };

  const handleNumberInputChange = (field: keyof ClientRequest, value: string, maxLength?: number) => {
    const filteredValue = value.replace(/[^0-9]/g, "");
    if (maxLength && filteredValue.length > maxLength) return;
    handleChange(field, filteredValue);
  };

  const checkDniExists = async (dni: string) => {
    if (!dni) return false;
    try {
      const response = await clientsApi.findByDni(dni);
      if (client && response.data?.id === client.id) {
        return false;
      }
      return response.data !== null;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (validate(form)) {
      setLoading(true);
      setApiError(null);

      if (!client && form.dni && form.clientType !== "TEMPORAL") {
        const dniExists = await checkDniExists(form.dni);
        if (dniExists) {
          setErrors(prev => ({ ...prev, dni: "El DNI ya se encuentra registrado." }));
          setLoading(false);
          return;
        }
      }

      try {
        const request: ClientRequest = {
          ...form,
          dni: form.dni || undefined,
          commercialName: form.commercialName || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          province: form.province || undefined,
          country: form.country || undefined,
        };

        let savedClient;
        if (client) {
          const response = await clientsApi.update(client.id, request);
          savedClient = response.data.data;
        } else {
          const response = await clientsApi.create(request);
          savedClient = response.data.data;
        }
        onSuccess(savedClient);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setApiError(error.response?.data?.message || "Error al guardar el cliente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isMetadataRequired = form.clientType !== "TEMPORAL";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{client ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
      <DialogContent>
        {apiError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert>}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cliente</InputLabel>
                <Select
                  value={form.clientType}
                  label="Tipo de Cliente"
                  onChange={(e) => handleChange("clientType", e.target.value as ClientType)}
                >
                  <MenuItem value="PERSONAL">PERSONAL</MenuItem>
                  <MenuItem value="EMPRESA">EMPRESA</MenuItem>
                  <MenuItem value="TEMPORAL">TEMPORAL</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.firstName}
                onChange={(e) => handleLetterInputChange("firstName", e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Apellido"
                value={form.lastName}
                onChange={(e) => handleLetterInputChange("lastName", e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={form.phone}
                onChange={(e) => handleNumberInputChange("phone", e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Fecha de Entrada"
                value={dayjs(form.entryDate)}
                onChange={(date) => handleChange("entryDate", date ? date.format("YYYY-MM-DD") : null)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {isMetadataRequired && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="DNI / Documento"
                    value={form.dni}
                    onChange={(e) => handleNumberInputChange("dni", e.target.value, 8)}
                    error={!!errors.dni}
                    helperText={errors.dni}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre Comercial"
                    value={form.commercialName}
                    onChange={(e) => handleChange("commercialName", e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Provincia"
                    value={form.province}
                    onChange={(e) => handleChange("province", e.target.value)}
                    error={!!errors.province}
                    helperText={errors.province}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="País"
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    error={!!errors.country}
                    helperText={errors.country}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isFormValid || loading}>
          {loading ? <CircularProgress size={24} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
