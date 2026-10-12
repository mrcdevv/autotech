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
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { useNavigate } from "react-router";
import axios from "axios";

import { clientAutocompleteApi } from "@/api/clientAutocomplete";
import { vehiclesApi } from "@/api/vehicles";
import { estimatesApi } from "@/api/estimates";
import { deliveryNotesApi } from "@/api/deliveryNotes";
import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { FormPageLayout } from "@/components/FormPageLayout";
import { FormSection } from "@/components/FormSection";
import { InfoList } from "@/components/InfoList";
import { useDeliveryNote } from "@/features/delivery-notes/hooks/useDeliveryNote";
import { ServicesGrid } from "./ServicesGrid";
import { ProductsGrid } from "./ProductsGrid";
import { DeliveryNoteSummary } from "./DeliveryNoteSummary";
import { PaymentsTab } from "@/features/payments/components/PaymentsTab";

import type { ClientAutocompleteResponse } from "@/types/vehicle";
import type { VehicleResponse } from "@/types/vehicle";
import type {
  DeliveryNoteServiceItemRequest,
  DeliveryNoteProductRequest,
  DeliveryNoteRequest,
} from "@/types/deliveryNote";

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
  services: DeliveryNoteServiceItemRequest[],
  products: DeliveryNoteProductRequest[],
  isTemporalClient: boolean,
): string[] {
  const errors: string[] = [];
  if (services.length === 0 && products.length === 0) {
    errors.push("Debés agregar al menos un servicio o un producto");
  }
  if (!isTemporalClient) {
    services.forEach((svc, i) => {
      if (!svc.serviceName.trim()) {
        errors.push(`Servicio #${i + 1}: el nombre es obligatorio`);
      }
      if (svc.price < 0) {
        errors.push(`Servicio #${i + 1}: el precio no puede ser negativo`);
      }
    });
  }
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

interface DeliveryNoteDetailProps {
  deliveryNoteId?: number;
  repairOrderId?: number;
  estimateId?: number;
  onBack?: () => void;
}

export function DeliveryNoteDetail({ deliveryNoteId, repairOrderId, estimateId, onBack }: DeliveryNoteDetailProps) {
  const navigate = useNavigate();
  const { deliveryNote, loading, error, clearError, createDeliveryNote } = useDeliveryNote(deliveryNoteId, repairOrderId);

  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState<ClientAutocompleteResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientAutocompleteResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [clientInputValue, setClientInputValue] = useState("");
  const [vehicleInputValue, setVehicleInputValue] = useState("");

  const [services, setServices] = useState<DeliveryNoteServiceItemRequest[]>([]);
  const [products, setProducts] = useState<DeliveryNoteProductRequest[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isTemporalClient, setIsTemporalClient] = useState(false);
  const [clientType, setClientType] = useState<string | null>(null);
  const [estimatePreloaded, setEstimatePreloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isCreateMode = !deliveryNoteId && !deliveryNote;
  const isReadonly = !isCreateMode;
  const fromRepairOrder = repairOrderId != null;
  const displayId = deliveryNote?.id ?? deliveryNoteId;

  useEffect(() => {
    if (deliveryNote) {
      setServices(
        deliveryNote.services.map((s) => ({ serviceName: s.serviceName, price: s.price })),
      );
      setProducts(
        deliveryNote.products.map((p) => ({
          productName: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
      );
      setDiscountPercentage(deliveryNote.discountPercentage);
      setClientType(deliveryNote.clientType);
      setIsTemporalClient(deliveryNote.clientType === "TEMPORAL");

      const nameParts = deliveryNote.clientFullName.split(" ");
      setSelectedClient({
        id: deliveryNote.clientId,
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        dni: deliveryNote.clientDni,
        phone: deliveryNote.clientPhone ?? null,
        email: deliveryNote.clientEmail ?? null,
        clientType: deliveryNote.clientType ?? null,
      });
      setClientInputValue(deliveryNote.clientFullName);

      if (deliveryNote.vehicleId) {
        setSelectedVehicle({
          id: deliveryNote.vehicleId,
          clientId: deliveryNote.clientId,
          clientFirstName: "",
          clientLastName: "",
          clientDni: null,
          plate: deliveryNote.vehiclePlate ?? "",
          chassisNumber: null,
          engineNumber: null,
          brandId: null,
          brandName: deliveryNote.vehicleBrand,
          model: deliveryNote.vehicleModel,
          year: deliveryNote.vehicleYear,
          vehicleTypeId: null,
          vehicleTypeName: null,
          observations: null,
          inRepair: false,
          createdAt: "",
        });
        setVehicleInputValue(
          `${deliveryNote.vehiclePlate}${deliveryNote.vehicleModel ? ` - ${deliveryNote.vehicleModel}` : ""}`,
        );
      }
    }
  }, [deliveryNote]);

  useEffect(() => {
    if (estimateId && isCreateMode && !estimatePreloaded) {
      const loadEstimateData = async () => {
        try {
          const res = await estimatesApi.getDeliveryNoteData(estimateId);
          const data = res.data.data;

          setServices(data.services.map((s) => ({ serviceName: s.serviceName, price: s.price })));
          setProducts(data.products.map((p) => ({ productName: p.productName, quantity: p.quantity, unitPrice: p.unitPrice })));
          setDiscountPercentage(data.discountPercentage);

          if (data.clientId) {
            try {
              const clientRes = await clientAutocompleteApi.search();
              const allClients = clientRes.data.data;
              const client = allClients.find((c) => c.id === data.clientId);
              if (client) {
                setSelectedClient(client);
                setClientInputValue(`${client.firstName} ${client.lastName}`);
                setIsTemporalClient(false);

                if (data.vehicleId) {
                  const vehicleRes = await vehiclesApi.getByClient(client.id);
                  const vehList = vehicleRes.data.data;
                  setVehicles(vehList);
                  const veh = vehList.find((v) => v.id === data.vehicleId);
                  if (veh) {
                    setSelectedVehicle(veh);
                    setVehicleInputValue(`${veh.plate}${veh.model ? ` - ${veh.model}` : ""}`);
                  }
                }
              }
            } catch {
              // ignore
            }
          }
          setEstimatePreloaded(true);
        } catch {
          setApiError("Error al cargar datos del presupuesto");
        }
      };
      loadEstimateData();
    }
  }, [estimateId, isCreateMode, estimatePreloaded]);

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
    if (isCreateMode && !fromRepairOrder) {
      fetchClients();
    }
  }, [fetchClients, isCreateMode, fromRepairOrder]);

  useEffect(() => {
    if (selectedClient && isCreateMode) {
      fetchVehicles(selectedClient.id);
    }
  }, [selectedClient, fetchVehicles, isCreateMode]);

  const servicesSubtotal = services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);
  const productsSubtotal = products.reduce(
    (sum, prod) => sum + (Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0),
    0,
  );

  const handleCreateClick = () => {
    if (!selectedClient) return;

    setApiError(null);
    setFormError(null);

    const validationErrors = validateForm(services, products, isTemporalClient);
    if (validationErrors.length > 0) {
      setShowErrors(true);
      const nonFieldError = validationErrors.find((e) => e.startsWith("Debés"));
      if (nonFieldError) setFormError(nonFieldError);
      return;
    }
    setShowErrors(false);
    setConfirmDialogOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!selectedClient) return;
    setConfirmDialogOpen(false);
    setSaving(true);
    try {
      const data: DeliveryNoteRequest = {
        clientId: selectedClient.id,
        vehicleId: selectedVehicle?.id ?? null,
        repairOrderId: repairOrderId ?? null,
        estimateId: estimateId ?? null,
        discountPercentage,
        services: isTemporalClient ? [] : services,
        products,
      };
      await createDeliveryNote(data);
      if (!fromRepairOrder) {
        navigate("/remitos");
      }
    } catch (err) {
      setApiError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = (_: unknown, value: ClientAutocompleteResponse | null) => {
    setSelectedClient(value);
    setSelectedVehicle(null);
    setVehicleInputValue("");
    setVehicles([]);
    if (value) {
      setIsTemporalClient(false);
      setClientType(null);
    } else {
      setIsTemporalClient(false);
      setClientType(null);
    }
  };

  const handleDownload = async () => {
    if (!deliveryNote?.id) return;
    setDownloading(true);
    setApiError(null);
    try {
      const res = await deliveryNotesApi.downloadPdf(deliveryNote.id);
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `remito-${deliveryNote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setApiError("No se pudo generar el PDF de la remito");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !isCreateMode) {
    return (
      <Box display="flex" justifyContent="center" mt={4} className="no-print">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !isCreateMode && !deliveryNote) {
    if (fromRepairOrder) {
      return (
        <Box sx={{ mt: 2 }} className="no-print">
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No hay remito asociada a esta orden de trabajo.
          </Typography>
          <Button variant="contained" onClick={() => clearError()}>
            Crear remito
          </Button>
        </Box>
      );
    }
    return <Alert severity="error" sx={{ mt: 2 }} className="no-print">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: fromRepairOrder ? 2 : 0 }}>
      {/* Print-only Header */}
      <Box
        sx={{
          display: "none",
          "@media print": {
            display: "block",
            mb: 4,
            borderBottom: "2px solid #000",
            pb: 2,
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight="bold">AUTOTECH</Typography>
            <Typography variant="body2">Servicio Mecánico Integral</Typography>
            <Typography variant="body2">Dirección: Av. Colón 1234, Córdoba</Typography>
            <Typography variant="body2">Teléfono: (351) 480-1234</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="h5" fontWeight="bold">REMITO</Typography>
            <Typography variant="body1">Nº: {deliveryNote?.id?.toString().padStart(8, "0") || "PROVISORIA"}</Typography>
            <Typography variant="body1">Fecha: {deliveryNote?.createdAt ? new Date(deliveryNote.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Control UI */}
      <Box className="no-print">
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          sx={{ pb: 1.5, mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {onBack && (
            <IconButton onClick={onBack} size="small" aria-label="Volver" sx={{ ml: -0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ fontSize: "1.25rem", fontWeight: 600 }}>
            {displayId ? `Remito #${displayId}` : "Nueva remito"}
          </Typography>
          {deliveryNote?.status && (
            <Chip
              label={deliveryNote.status === "PAGADA" ? "Pagada" : "Pendiente"}
              color={deliveryNote.status === "PAGADA" ? "success" : "warning"}
            />
          )}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            {!isCreateMode && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? "Generando..." : "Descargar remito"}
              </Button>
            )}
          </Box>
        </Stack>

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

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Datos de la Remito" />
          <Tab label="Pagos" disabled={isCreateMode} />
        </Tabs>
      </Box>

      {/* Tab: DeliveryNote Data */}
      {activeTab === 0 && (
        <FormPageLayout
          aside={
            <Stack spacing={2}>
              <DeliveryNoteSummary
                servicesSubtotal={isTemporalClient ? 0 : servicesSubtotal}
                productsSubtotal={productsSubtotal}
                discountPercentage={discountPercentage}
                onDiscountChange={setDiscountPercentage}
                readonly={isReadonly}
              />
              {isCreateMode && (
                <Paper className="no-print" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleCreateClick}
                    disabled={saving || !selectedClient}
                    fullWidth
                  >
                    {saving ? "Creando..." : "Crear remito"}
                  </Button>
                </Paper>
              )}
            </Stack>
          }
        >
          <Stack spacing={3}>
          {/* Print-only Client Info Layout */}
          <Box sx={{ display: "none", "@media print": { display: "block", mb: 3 } }}>
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" color="textSecondary">CLIENTE</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {deliveryNote?.clientFullName || `${selectedClient?.firstName} ${selectedClient?.lastName}`}
                </Typography>
                <Typography variant="body2">DNI: {deliveryNote?.clientDni || selectedClient?.dni || "—"}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="textSecondary">VEHÍCULO</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {deliveryNote?.vehiclePlate || selectedVehicle?.plate}
                </Typography>
                <Typography variant="body2">
                  {deliveryNote?.vehicleBrand || selectedVehicle?.brandName} {deliveryNote?.vehicleModel || selectedVehicle?.model}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Client & Vehicle Section */}
          <FormSection
            className="no-print"
            title="Cliente y vehículo"
            icon={<PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />}
          >
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
                  onChange={handleClientChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Cliente" size="small" />
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

              {(selectedClient || selectedVehicle) && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mt: 3,
                    pt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  {selectedClient && (
                    <InfoList
                      title="Datos del cliente"
                      icon={<PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                      items={[
                        { label: "Nombre", value: `${selectedClient.firstName} ${selectedClient.lastName}` },
                        { label: "DNI", value: selectedClient.dni },
                        ...(deliveryNote?.clientPhone || selectedClient.phone
                          ? [{ label: "Teléfono", value: deliveryNote?.clientPhone ?? selectedClient.phone }]
                          : []),
                        ...(deliveryNote?.clientEmail || selectedClient.email
                          ? [{ label: "Email", value: deliveryNote?.clientEmail ?? selectedClient.email }]
                          : []),
                        ...(clientType || deliveryNote?.clientType || selectedClient.clientType
                          ? [{ label: "Tipo de cliente", value: clientType ?? deliveryNote?.clientType ?? selectedClient.clientType }]
                          : []),
                      ]}
                    />
                  )}
                  {selectedVehicle && (
                    <InfoList
                      title="Datos del vehículo"
                      icon={<DirectionsCarIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                      items={[
                        { label: "Patente", value: selectedVehicle.plate },
                        { label: "Marca", value: selectedVehicle.brandName },
                        { label: "Modelo", value: selectedVehicle.model },
                        { label: "Año", value: selectedVehicle.year },
                      ]}
                    />
                  )}
                </Box>
              )}
          </FormSection>

          {/* Services */}
          {!isTemporalClient && (
            <ServicesGrid
              services={services}
              onChange={setServices}
              readonly={isReadonly}
              showErrors={showErrors}
            />
          )}

          {/* Products */}
          <ProductsGrid
            products={products}
            onChange={setProducts}
            readonly={isReadonly}
            showErrors={showErrors}
          />

          </Stack>
        </FormPageLayout>
      )}

      {/* Tab: Payments */}
      {activeTab === 1 && deliveryNote?.id && (
        <Box className="no-print">
          <PaymentsTab
            deliveryNoteId={deliveryNote.id}
            clientFullName={deliveryNote.clientFullName}
          />
        </Box>
      )}

      {/* Confirm Dialog */}
      <AppConfirmDialog
        open={confirmDialogOpen}
        className="no-print"
        title="Confirmar creación de remito"
        message="¿Está seguro de que los datos son correctos? Una vez creada, la remito no se podrá editar."
        confirmLabel="Confirmar"
        onConfirm={handleConfirmCreate}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
}
