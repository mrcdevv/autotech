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
import { invoicesApi } from "@/api/invoices";
import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { FormPageLayout } from "@/components/FormPageLayout";
import { FormSection } from "@/components/FormSection";
import { InfoList } from "@/components/InfoList";
import { useInvoice } from "@/features/invoices/hooks/useInvoice";
import { ServicesGrid } from "./ServicesGrid";
import { ProductsGrid } from "./ProductsGrid";
import { InvoiceSummary } from "./InvoiceSummary";
import { PaymentsTab } from "@/features/payments/components/PaymentsTab";

import type { ClientAutocompleteResponse } from "@/types/vehicle";
import type { VehicleResponse } from "@/types/vehicle";
import type {
  InvoiceServiceItemRequest,
  InvoiceProductRequest,
  InvoiceRequest,
} from "@/types/invoice";

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
  services: InvoiceServiceItemRequest[],
  products: InvoiceProductRequest[],
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

interface InvoiceDetailProps {
  invoiceId?: number;
  repairOrderId?: number;
  estimateId?: number;
  onBack?: () => void;
}

export function InvoiceDetail({ invoiceId, repairOrderId, estimateId, onBack }: InvoiceDetailProps) {
  const navigate = useNavigate();
  const { invoice, loading, error, clearError, createInvoice } = useInvoice(invoiceId, repairOrderId);

  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState<ClientAutocompleteResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientAutocompleteResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [clientInputValue, setClientInputValue] = useState("");
  const [vehicleInputValue, setVehicleInputValue] = useState("");

  const [services, setServices] = useState<InvoiceServiceItemRequest[]>([]);
  const [products, setProducts] = useState<InvoiceProductRequest[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isTemporalClient, setIsTemporalClient] = useState(false);
  const [clientType, setClientType] = useState<string | null>(null);
  const [estimatePreloaded, setEstimatePreloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isCreateMode = !invoiceId && !invoice;
  const isReadonly = !isCreateMode;
  const fromRepairOrder = repairOrderId != null;
  const displayId = invoice?.id ?? invoiceId;

  useEffect(() => {
    if (invoice) {
      setServices(
        invoice.services.map((s) => ({ serviceName: s.serviceName, price: s.price })),
      );
      setProducts(
        invoice.products.map((p) => ({
          productName: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
      );
      setDiscountPercentage(invoice.discountPercentage);
      setTaxPercentage(invoice.taxPercentage);
      setClientType(invoice.clientType);
      setIsTemporalClient(invoice.clientType === "TEMPORAL");

      const nameParts = invoice.clientFullName.split(" ");
      setSelectedClient({
        id: invoice.clientId,
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        dni: invoice.clientDni,
        phone: invoice.clientPhone ?? null,
        email: invoice.clientEmail ?? null,
        clientType: invoice.clientType ?? null,
      });
      setClientInputValue(invoice.clientFullName);

      if (invoice.vehicleId) {
        setSelectedVehicle({
          id: invoice.vehicleId,
          clientId: invoice.clientId,
          clientFirstName: "",
          clientLastName: "",
          clientDni: null,
          plate: invoice.vehiclePlate ?? "",
          chassisNumber: null,
          engineNumber: null,
          brandId: null,
          brandName: invoice.vehicleBrand,
          model: invoice.vehicleModel,
          year: invoice.vehicleYear,
          vehicleTypeId: null,
          vehicleTypeName: null,
          observations: null,
          inRepair: false,
          createdAt: "",
        });
        setVehicleInputValue(
          `${invoice.vehiclePlate}${invoice.vehicleModel ? ` - ${invoice.vehicleModel}` : ""}`,
        );
      }
    }
  }, [invoice]);

  useEffect(() => {
    if (estimateId && isCreateMode && !estimatePreloaded) {
      const loadEstimateData = async () => {
        try {
          const res = await estimatesApi.getInvoiceData(estimateId);
          const data = res.data.data;

          setServices(data.services.map((s) => ({ serviceName: s.serviceName, price: s.price })));
          setProducts(data.products.map((p) => ({ productName: p.productName, quantity: p.quantity, unitPrice: p.unitPrice })));
          setDiscountPercentage(data.discountPercentage);
          setTaxPercentage(data.taxPercentage);

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
      const data: InvoiceRequest = {
        clientId: selectedClient.id,
        vehicleId: selectedVehicle?.id ?? null,
        repairOrderId: repairOrderId ?? null,
        estimateId: estimateId ?? null,
        discountPercentage,
        taxPercentage,
        services: isTemporalClient ? [] : services,
        products,
      };
      await createInvoice(data);
      if (!fromRepairOrder) {
        navigate("/facturas");
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
    if (!invoice?.id) return;
    setDownloading(true);
    setApiError(null);
    try {
      const res = await invoicesApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura-${invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setApiError("No se pudo generar el PDF de la factura");
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

  if (error && !isCreateMode && !invoice) {
    if (fromRepairOrder) {
      return (
        <Box sx={{ mt: 2 }} className="no-print">
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No hay factura asociada a esta orden de trabajo.
          </Typography>
          <Button variant="contained" onClick={() => clearError()}>
            Crear factura
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
            <Typography variant="h5" fontWeight="bold">FACTURA</Typography>
            <Typography variant="body1">Nº: {invoice?.id?.toString().padStart(8, "0") || "PROVISORIA"}</Typography>
            <Typography variant="body1">Fecha: {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</Typography>
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
            {displayId ? `Factura #${displayId}` : "Nueva factura"}
          </Typography>
          {invoice?.status && (
            <Chip
              label={invoice.status === "PAGADA" ? "Pagada" : "Pendiente"}
              color={invoice.status === "PAGADA" ? "success" : "warning"}
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
                {downloading ? "Generando..." : "Descargar factura"}
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
          <Tab label="Datos de la Factura" />
          <Tab label="Pagos" disabled={isCreateMode} />
        </Tabs>
      </Box>

      {/* Tab: Invoice Data */}
      {activeTab === 0 && (
        <FormPageLayout
          aside={
            <Stack spacing={2}>
              <InvoiceSummary
                servicesSubtotal={isTemporalClient ? 0 : servicesSubtotal}
                productsSubtotal={productsSubtotal}
                discountPercentage={discountPercentage}
                taxPercentage={taxPercentage}
                onDiscountChange={setDiscountPercentage}
                onTaxChange={setTaxPercentage}
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
                    {saving ? "Creando..." : "Crear factura"}
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
                  {invoice?.clientFullName || `${selectedClient?.firstName} ${selectedClient?.lastName}`}
                </Typography>
                <Typography variant="body2">DNI: {invoice?.clientDni || selectedClient?.dni || "—"}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" color="textSecondary">VEHÍCULO</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {invoice?.vehiclePlate || selectedVehicle?.plate}
                </Typography>
                <Typography variant="body2">
                  {invoice?.vehicleBrand || selectedVehicle?.brandName} {invoice?.vehicleModel || selectedVehicle?.model}
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
                        ...(invoice?.clientPhone || selectedClient.phone
                          ? [{ label: "Teléfono", value: invoice?.clientPhone ?? selectedClient.phone }]
                          : []),
                        ...(invoice?.clientEmail || selectedClient.email
                          ? [{ label: "Email", value: invoice?.clientEmail ?? selectedClient.email }]
                          : []),
                        ...(clientType || invoice?.clientType || selectedClient.clientType
                          ? [{ label: "Tipo de cliente", value: clientType ?? invoice?.clientType ?? selectedClient.clientType }]
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
      {activeTab === 1 && invoice?.id && (
        <Box className="no-print">
          <PaymentsTab
            invoiceId={invoice.id}
            clientFullName={invoice.clientFullName}
          />
        </Box>
      )}

      {/* Confirm Dialog */}
      <AppConfirmDialog
        open={confirmDialogOpen}
        className="no-print"
        title="Confirmar creación de factura"
        message="¿Está seguro de que los datos son correctos? Una vez creada, la factura no se podrá editar."
        confirmLabel="Confirmar"
        onConfirm={handleConfirmCreate}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
}
