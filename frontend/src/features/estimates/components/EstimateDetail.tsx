import { useState, useEffect, useCallback } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import axios from "axios";

import { clientAutocompleteApi } from "@/api/clientAutocomplete";
import { vehiclesApi } from "@/api/vehicles";
import { useEstimate } from "@/features/estimates/hooks/useEstimate";
import { ServicesGrid } from "./ServicesGrid";
import { ProductsGrid } from "./ProductsGrid";
import { EstimateSummary } from "./EstimateSummary";

import type { ClientAutocompleteResponse } from "@/types/vehicle";
import type { VehicleResponse } from "@/types/vehicle";
import type {
  EstimateServiceItemRequest,
  EstimateProductRequest,
  EstimateRequest,
} from "@/types/estimate";

function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (data.data && typeof data.data === "object") {
      return Object.values(data.data).join(". ");
    }
    if (data.message) return data.message;
  }
  return "Ocurrió un error inesperado";
}

function validateForm(
  services: EstimateServiceItemRequest[],
  products: EstimateProductRequest[],
): string[] {
  const errors: string[] = [];
  if (services.length === 0 && products.length === 0) {
    errors.push("Debés agregar al menos un servicio o un producto");
  }
  services.forEach((svc, i) => {
    if (!svc.serviceName.trim()) {
      errors.push(`Servicio #${i + 1}: el nombre es obligatorio`);
    }
    if (svc.price < 0) {
      errors.push(`Servicio #${i + 1}: el precio no puede ser negativo`);
    }
  });
  products.forEach((prod, i) => {
    if (!prod.productName.trim()) {
      errors.push(`Producto #${i + 1}: el nombre es obligatorio`);
    }
    if (prod.quantity < 1) {
      errors.push(`Producto #${i + 1}: la cantidad debe ser al menos 1`);
    }
    if (prod.unitPrice < 0) {
      errors.push(`Producto #${i + 1}: el precio unitario no puede ser negativo`);
    }
  });
  return errors;
}

interface EstimateDetailProps {
  estimateId?: number;
  repairOrderId?: number;
}

export function EstimateDetail({ estimateId, repairOrderId }: EstimateDetailProps) {
  const navigate = useNavigate();
  const { estimate, loading, error, createEstimate, updateEstimate, approveEstimate, rejectEstimate } =
    useEstimate(estimateId, repairOrderId);

  const [clients, setClients] = useState<ClientAutocompleteResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientAutocompleteResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [clientInputValue, setClientInputValue] = useState("");
  const [vehicleInputValue, setVehicleInputValue] = useState("");

  const [services, setServices] = useState<EstimateServiceItemRequest[]>([]);
  const [products, setProducts] = useState<EstimateProductRequest[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isNew = !estimateId && !repairOrderId;
  const isReadonly = estimate != null && estimate.status !== "PENDIENTE";
  const fromRepairOrder = repairOrderId != null;

  useEffect(() => {
    if (estimate) {
      setServices(
        estimate.services.map((s) => ({ serviceName: s.serviceName, price: s.price })),
      );
      setProducts(
        estimate.products.map((p) => ({
          productName: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
      );
      setDiscountPercentage(estimate.discountPercentage);
      setTaxPercentage(estimate.taxPercentage);

      const nameParts = estimate.clientFullName.split(" ");
      setSelectedClient({
        id: estimate.clientId,
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        dni: estimate.clientDni,
      });
      setClientInputValue(estimate.clientFullName);

      if (estimate.vehicleId) {
        setSelectedVehicle({
          id: estimate.vehicleId,
          clientId: estimate.clientId,
          clientFirstName: "",
          clientLastName: "",
          clientDni: null,
          plate: estimate.vehiclePlate,
          chassisNumber: null,
          engineNumber: null,
          brandId: null,
          brandName: estimate.vehicleBrand,
          model: estimate.vehicleModel,
          year: estimate.vehicleYear,
          vehicleTypeId: null,
          vehicleTypeName: null,
          observations: null,
          inRepair: false,
          createdAt: "",
        });
        setVehicleInputValue(
          `${estimate.vehiclePlate}${estimate.vehicleModel ? ` - ${estimate.vehicleModel}` : ""}`,
        );
      }
    }
  }, [estimate]);

  const fetchClients = useCallback(async (query?: string) => {
    try {
      const res = await clientAutocompleteApi.search(query);
      setClients(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  const fetchVehicles = useCallback(async (clientId: number) => {
    try {
      const res = await vehiclesApi.getByClient(clientId);
      setVehicles(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!fromRepairOrder) {
      fetchClients();
    }
  }, [fetchClients, fromRepairOrder]);

  useEffect(() => {
    if (selectedClient) {
      fetchVehicles(selectedClient.id);
    } else {
      setVehicles([]);
      setSelectedVehicle(null);
      setVehicleInputValue("");
    }
  }, [selectedClient, fetchVehicles]);

  const servicesSubtotal = services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);
  const productsSubtotal = products.reduce(
    (sum, prod) => sum + (Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0),
    0,
  );

  const handleSave = async () => {
    if (!selectedClient || !selectedVehicle) return;

    setApiError(null);
    setFormError(null);

    const validationErrors = validateForm(services, products);
    if (validationErrors.length > 0) {
      setShowErrors(true);
      const nonFieldError = validationErrors.find((e) => e.startsWith("Debés"));
      if (nonFieldError) setFormError(nonFieldError);
      return;
    }
    setShowErrors(false);

    setSaving(true);
    try {
      const data: EstimateRequest = {
        clientId: selectedClient.id,
        vehicleId: selectedVehicle.id,
        repairOrderId: repairOrderId ?? estimate?.repairOrderId ?? null,
        discountPercentage,
        taxPercentage,
        services,
        products,
      };
      if (estimate?.id) {
        await updateEstimate(estimate.id, data);
      } else {
        await createEstimate(data);
      }
      if (!fromRepairOrder) {
        navigate("/presupuestos");
      }
    } catch (err) {
      setApiError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!estimate?.id) return;
    setApiError(null);
    try {
      await approveEstimate(estimate.id);
      if (!fromRepairOrder) {
        navigate("/presupuestos");
      }
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!estimate?.id) return;
    setApiError(null);
    try {
      await rejectEstimate(estimate.id);
      if (!fromRepairOrder) {
        navigate("/presupuestos");
      }
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  if (loading && !isNew) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !isNew && !estimate) {
    if (fromRepairOrder) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No hay presupuesto asociado a esta orden de trabajo.
          </Typography>
          <Button variant="contained" onClick={() => {
            setServices([]);
            setProducts([]);
            setDiscountPercentage(0);
            setTaxPercentage(0);
          }}>
            Crear presupuesto
          </Button>
        </Box>
      );
    }
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {estimate?.status && (
        <Box mb={2}>
          <Chip
            label={estimate.status}
            color={
              estimate.status === "ACEPTADO"
                ? "success"
                : estimate.status === "RECHAZADO"
                  ? "error"
                  : "warning"
            }
          />
        </Box>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      {formError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Datos del cliente y vehículo
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Autocomplete
            options={clients}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName}${option.dni ? ` (${option.dni})` : ""}`
            }
            value={selectedClient}
            inputValue={clientInputValue}
            onInputChange={(_, value) => {
              setClientInputValue(value);
              if (value.length >= 2) fetchClients(value);
            }}
            onChange={(_, value) => {
              setSelectedClient(value);
              setSelectedVehicle(null);
              setVehicleInputValue("");
            }}
            renderInput={(params) => (
              <TextField {...params} label="Cliente" size="small" />
            )}
            disabled={isReadonly || fromRepairOrder}
            sx={{ minWidth: 300 }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <Autocomplete
            options={vehicles}
            getOptionLabel={(option) =>
              `${option.plate}${option.model ? ` - ${option.model}` : ""}`
            }
            value={selectedVehicle}
            inputValue={vehicleInputValue}
            onInputChange={(_, value) => setVehicleInputValue(value)}
            onChange={(_, value) => {
              setSelectedVehicle(value);
              setVehicleInputValue(
                value ? `${value.plate}${value.model ? ` - ${value.model}` : ""}` : "",
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Vehículo" size="small" />
            )}
            disabled={isReadonly || fromRepairOrder || !selectedClient}
            sx={{ minWidth: 300 }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Box>
        {selectedClient && (
          <Box display="flex" gap={2} mt={2} flexWrap="wrap">
            <TextField
              label="DNI"
              value={selectedClient.dni ?? "—"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
          </Box>
        )}
        {selectedVehicle && (
          <Box display="flex" gap={2} mt={1} flexWrap="wrap">
            <TextField
              label="Patente"
              value={selectedVehicle.plate}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Marca"
              value={selectedVehicle.brandName ?? "—"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Modelo"
              value={selectedVehicle.model ?? "—"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Año"
              value={selectedVehicle.year ?? "—"}
              size="small"
              slotProps={{ input: { readOnly: true } }}
            />
          </Box>
        )}
      </Paper>

      {estimate?.mechanicNotes && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Observaciones del mecánico
          </Typography>
          <TextField
            multiline
            fullWidth
            minRows={2}
            value={estimate.mechanicNotes}
            slotProps={{ input: { readOnly: true } }}
          />
        </Paper>
      )}

      {estimate?.inspectionIssues && estimate.inspectionIssues.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Problemas de inspección
          </Typography>
          {estimate.inspectionIssues.map((issue) => (
            <Box key={issue.inspectionItemId} display="flex" gap={2} alignItems="center" mb={1}>
              <Chip
                label={issue.status}
                color={issue.status === "PROBLEMA" ? "error" : "warning"}
                size="small"
              />
              <Typography>{issue.itemName}</Typography>
              {issue.comment && (
                <Typography color="text.secondary" variant="body2">
                  — {issue.comment}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <ServicesGrid services={services} onChange={setServices} readonly={isReadonly} showErrors={showErrors} />

      <Divider sx={{ my: 3 }} />

      <ProductsGrid products={products} onChange={setProducts} readonly={isReadonly} showErrors={showErrors} />

      <Divider sx={{ my: 3 }} />

      <EstimateSummary
        servicesSubtotal={servicesSubtotal}
        productsSubtotal={productsSubtotal}
        discountPercentage={discountPercentage}
        taxPercentage={taxPercentage}
        onDiscountChange={setDiscountPercentage}
        onTaxChange={setTaxPercentage}
        readonly={isReadonly}
      />

      <Box display="flex" gap={2} mt={3}>
        {!isReadonly && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !selectedClient || !selectedVehicle}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        )}
        {estimate?.id && estimate.status === "PENDIENTE" && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleApprove}
            >
              Aprobar
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              onClick={handleReject}
            >
              Rechazar
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
