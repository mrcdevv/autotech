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
  Stack,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useNavigate } from "react-router";
import axios from "axios";

import { clientAutocompleteApi } from "@/api/clientAutocomplete";
import { vehiclesApi } from "@/api/vehicles";
import { inspectionsApi } from "@/api/inspections";
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
import type { InspectionResponse } from "@/features/inspections/types";

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

interface InspectionIssue {
  id: number;
  name: string;
  status: string;
  comment: string | null;
}

function extractIssuesFromInspections(inspections: InspectionResponse[]): InspectionIssue[] {
  const issues: InspectionIssue[] = [];
  for (const inspection of inspections) {
    for (const group of inspection.groups) {
      for (const item of group.items) {
        if (item.status === "PROBLEMA" || item.status === "REVISAR") {
          issues.push({
            id: item.id,
            name: item.templateItemName,
            status: item.status,
            comment: item.comment,
          });
        }
      }
    }
  }
  return issues;
}

interface RepairOrderClientData {
  id: number;
  firstName: string;
  lastName: string;
  dni: string | null;
}

interface RepairOrderVehicleData {
  id: number;
  plate: string;
  brandName: string | null;
  model: string | null;
  year: number | null;
}

interface EstimateDetailProps {
  estimateId?: number;
  repairOrderId?: number;
  reason?: string | null;
  mechanicNotes?: string | null;
  repairOrderClient?: RepairOrderClientData;
  repairOrderVehicle?: RepairOrderVehicleData;
}

interface InfoFieldProps {
  label: string;
  value: string | number | null | undefined;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <Box sx={{ minWidth: 100 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.6, display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function ContextSections({
  reason,
  mechanicNotes,
  inspectionIssues,
}: {
  reason?: string | null;
  mechanicNotes?: string | null;
  inspectionIssues: InspectionIssue[];
}) {
  const hasContent = reason || mechanicNotes || inspectionIssues.length > 0;
  if (!hasContent) return null;

  return (
    <>
      {reason && (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box
            sx={{
              px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5,
              bgcolor: "grey.50", borderBottom: 1, borderColor: "divider",
            }}
          >
            <ChatBubbleOutlineIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
              Motivo de consulta
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {reason}
            </Typography>
          </Box>
        </Paper>
      )}

      {mechanicNotes && (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box
            sx={{
              px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5,
              bgcolor: "grey.50", borderBottom: 1, borderColor: "divider",
            }}
          >
            <EngineeringIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
              Observaciones del mecánico
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {mechanicNotes}
            </Typography>
          </Box>
        </Paper>
      )}

      {inspectionIssues.length > 0 && (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box
            sx={{
              px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5,
              bgcolor: "grey.50", borderBottom: 1, borderColor: "divider",
            }}
          >
            <ReportProblemIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
              Problemas de inspección
            </Typography>
            <Typography
              variant="caption"
              sx={{ bgcolor: "warning.main", color: "white", px: 1, py: 0.25, borderRadius: 1, fontSize: "0.7rem", fontWeight: 600 }}
            >
              {inspectionIssues.length}
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Stack spacing={1}>
              {inspectionIssues.map((issue) => (
                <Box
                  key={issue.id}
                  sx={{
                    display: "flex", gap: 2, alignItems: "center", p: 1.5, borderRadius: 1,
                    bgcolor: issue.status === "PROBLEMA" ? "error.50" : "warning.50",
                    border: 1,
                    borderColor: issue.status === "PROBLEMA" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                  }}
                >
                  <Chip
                    label={issue.status}
                    color={issue.status === "PROBLEMA" ? "error" : "warning"}
                    size="small"
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{issue.name}</Typography>
                    {issue.comment && (
                      <Typography variant="caption" color="text.secondary">
                        {issue.comment}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
}

export function EstimateDetail({ estimateId, repairOrderId, reason, mechanicNotes, repairOrderClient, repairOrderVehicle }: EstimateDetailProps) {
  const navigate = useNavigate();
  const { estimate, allEstimates, noActiveEstimate, loading, error, clearError, createEstimate, updateEstimate, approveEstimate, rejectEstimate } =
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
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [inspectionIssues, setInspectionIssues] = useState<InspectionIssue[]>([]);

  const isNew = !estimateId && !repairOrderId;
  const isReadonly = estimate != null && estimate.status !== "PENDIENTE";
  const fromRepairOrder = repairOrderId != null;

  // Fetch inspection issues independently so they're always available
  useEffect(() => {
    if (!repairOrderId) return;
    let cancelled = false;
    const fetchIssues = async () => {
      try {
        const res = await inspectionsApi.getByRepairOrder(repairOrderId);
        if (!cancelled) {
          setInspectionIssues(extractIssuesFromInspections(res.data.data));
        }
      } catch {
        // non-critical
      }
    };
    fetchIssues();
    return () => { cancelled = true; };
  }, [repairOrderId]);

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
        phone: null,
        email: null,
        clientType: null,
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

  const prepareNewEstimate = () => {
    if (repairOrderClient) {
      setSelectedClient({
        id: repairOrderClient.id,
        firstName: repairOrderClient.firstName,
        lastName: repairOrderClient.lastName,
        dni: repairOrderClient.dni,
        phone: null,
        email: null,
        clientType: null,
      });
      setClientInputValue(`${repairOrderClient.firstName} ${repairOrderClient.lastName}`);
    }
    if (repairOrderVehicle) {
      setSelectedVehicle({
        id: repairOrderVehicle.id,
        clientId: repairOrderClient?.id ?? 0,
        clientFirstName: "",
        clientLastName: "",
        clientDni: null,
        plate: repairOrderVehicle.plate,
        chassisNumber: null,
        engineNumber: null,
        brandId: null,
        brandName: repairOrderVehicle.brandName,
        model: repairOrderVehicle.model,
        year: repairOrderVehicle.year,
        vehicleTypeId: null,
        vehicleTypeName: null,
        observations: null,
        inRepair: false,
        createdAt: "",
      });
      setVehicleInputValue(
        `${repairOrderVehicle.plate}${repairOrderVehicle.model ? ` - ${repairOrderVehicle.model}` : ""}`,
      );
    }
    setServices([]);
    setProducts([]);
    setDiscountPercentage(0);
    setTaxPercentage(0);
    clearError();
    setIsCreatingNew(true);
  };

  const rejectedEstimates = allEstimates.filter((e) => e.status === "RECHAZADO");

  // ── Loading state ──
  if (loading && !isNew) {
    return (
      <Stack spacing={3} sx={{ mt: 2 }}>
        <ContextSections reason={reason} mechanicNotes={mechanicNotes} inspectionIssues={inspectionIssues} />
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  // ── No active estimate (repair order context) ──
  if ((error || noActiveEstimate) && !isNew && !estimate && !isCreatingNew) {
    if (fromRepairOrder) {
      return (
        <Stack spacing={3} sx={{ mt: 2 }}>
          <ContextSections reason={reason} mechanicNotes={mechanicNotes} inspectionIssues={inspectionIssues} />

          {rejectedEstimates.length > 0 ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                {rejectedEstimates.length === 1
                  ? "El presupuesto anterior fue rechazado."
                  : `Los ${rejectedEstimates.length} presupuestos anteriores fueron rechazados.`}
                {" "}Puede crear uno nuevo.
              </Alert>
              {rejectedEstimates.map((est) => (
                <Box
                  key={est.id}
                  sx={{
                    display: "flex", alignItems: "center", gap: 2,
                    p: 1.5, mb: 1, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "grey.50",
                  }}
                >
                  <Chip label="Rechazado" color="error" size="small" />
                  <Typography variant="body2">
                    #{est.id} — ${est.total?.toLocaleString("es-AR") ?? "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(est.createdAt).toLocaleDateString("es-AR")}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No hay presupuesto asociado a esta orden de trabajo.
            </Typography>
          )}

          <Box>
            <Button variant="contained" onClick={prepareNewEstimate}>
              Crear presupuesto
            </Button>
          </Box>
        </Stack>
      );
    }
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  // ── Main form ──
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      {estimate?.status && (
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={estimate.status === "ACEPTADO" ? "Aprobado" : estimate.status === "RECHAZADO" ? "Rechazado" : "Pendiente"}
            color={
              estimate.status === "ACEPTADO"
                ? "success"
                : estimate.status === "RECHAZADO"
                  ? "error"
                  : "warning"
            }
          />
          {rejectedEstimates.length > 0 && estimate.status !== "RECHAZADO" && (
            <Typography variant="caption" color="text.secondary">
              {rejectedEstimates.length} presupuesto{rejectedEstimates.length > 1 ? "s" : ""} rechazado{rejectedEstimates.length > 1 ? "s" : ""} anteriormente
            </Typography>
          )}
        </Box>
      )}

      {apiError && (
        <Alert severity="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      {formError && (
        <Alert severity="warning" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {/* Context: always visible */}
      <ContextSections reason={reason} mechanicNotes={mechanicNotes} inspectionIssues={inspectionIssues} />

      {/* Client & Vehicle Section */}
      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box
          sx={{
            px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5,
            bgcolor: "grey.50", borderBottom: 1, borderColor: "divider",
          }}
        >
          <PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
            Cliente y vehículo
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Autocomplete
              options={clients}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}${option.dni ? ` (${option.dni})` : ""}`
              }
              value={selectedClient}
              inputValue={clientInputValue}
              onInputChange={(_, value) => {
                const filteredValue = value.replace(/[^a-zA-Z\s\u00C0-\u017F]/g, "");
                setClientInputValue(filteredValue);
                if (filteredValue.length >= 2 || filteredValue.length === 0) fetchClients(filteredValue);
              }}
              onOpen={() => {
                if (clientInputValue.length === 0) fetchClients("");
              }}
              onChange={(_, value) => {
                setSelectedClient(value);
                setSelectedVehicle(null);
                setVehicleInputValue("");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  size="small"
                  onBeforeInput={(e) => {
                    const data = (e as unknown as { data: string }).data;
                    if (data && /[0-9]/.test(data)) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
              disabled={isReadonly || fromRepairOrder}
              sx={{ minWidth: 300, flex: 1 }}
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
              sx={{ minWidth: 300, flex: 1 }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Box>

          {selectedClient && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                  Datos del cliente
                </Typography>
              </Box>
              <Box display="flex" gap={4} flexWrap="wrap">
                <InfoField label="Nombre" value={`${selectedClient.firstName} ${selectedClient.lastName}`} />
                <InfoField label="DNI" value={selectedClient.dni} />
                {selectedClient.phone && <InfoField label="Teléfono" value={selectedClient.phone} />}
                {selectedClient.email && <InfoField label="Email" value={selectedClient.email} />}
                {selectedClient.clientType && <InfoField label="Tipo de cliente" value={selectedClient.clientType} />}
              </Box>
            </Box>
          )}

          {selectedVehicle && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <DirectionsCarIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                  Datos del vehículo
                </Typography>
              </Box>
              <Box display="flex" gap={4} flexWrap="wrap">
                <InfoField label="Patente" value={selectedVehicle.plate} />
                <InfoField label="Marca" value={selectedVehicle.brandName} />
                <InfoField label="Modelo" value={selectedVehicle.model} />
                <InfoField label="Año" value={selectedVehicle.year} />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Services Grid */}
      <ServicesGrid services={services} onChange={setServices} readonly={isReadonly} showErrors={showErrors} />

      {/* Products Grid */}
      <ProductsGrid products={products} onChange={setProducts} readonly={isReadonly} showErrors={showErrors} />

      {/* Summary */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Box sx={{ width: { xs: "100%", md: 420 } }}>
          <EstimateSummary
            servicesSubtotal={servicesSubtotal}
            productsSubtotal={productsSubtotal}
            discountPercentage={discountPercentage}
            taxPercentage={taxPercentage}
            onDiscountChange={setDiscountPercentage}
            onTaxChange={setTaxPercentage}
            readonly={isReadonly}
          />
        </Box>
      </Box>

      {/* Actions */}
      {(!isReadonly || (estimate?.id && estimate.status === "PENDIENTE")) && (
        <Paper
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            bgcolor: "grey.50",
          }}
        >
          {estimate?.id && estimate.status === "PENDIENTE" && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleReject}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={handleApprove}
              >
                Aprobar
              </Button>
            </>
          )}
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
        </Paper>
      )}
    </Stack>
  );
}
