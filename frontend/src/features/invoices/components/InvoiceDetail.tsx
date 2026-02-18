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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router";
import axios from "axios";

import { clientAutocompleteApi } from "@/api/clientAutocomplete";
import { vehiclesApi } from "@/api/vehicles";
import { estimatesApi } from "@/api/estimates";
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
}

export function InvoiceDetail({ invoiceId, repairOrderId, estimateId }: InvoiceDetailProps) {
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

  const isCreateMode = !invoiceId && !invoice;
  const isReadonly = !isCreateMode;
  const fromRepairOrder = repairOrderId != null;

  // Populate form from existing invoice
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

  // Pre-load from estimate
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

          // Load client
          if (data.clientId) {
            try {
              const clientRes = await clientAutocompleteApi.search();
              const allClients = clientRes.data.data;
              const client = allClients.find((c) => c.id === data.clientId);
              if (client) {
                setSelectedClient(client);
                setClientInputValue(`${client.firstName} ${client.lastName}`);
                setIsTemporalClient(false);

                // Load vehicles for this client
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
      // Check client type from API response - we need to detect TEMPORAL
      // The autocomplete doesn't have clientType, so we check if DNI is null
      // For a proper implementation, we'd need to add clientType to the autocomplete response
      // For now we'll handle it when the invoice is created (backend validates)
      setIsTemporalClient(false);
      setClientType(null);
    } else {
      setIsTemporalClient(false);
      setClientType(null);
    }
  };

  if (loading && !isCreateMode) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !isCreateMode && !invoice) {
    if (fromRepairOrder) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No hay factura asociada a esta orden de trabajo.
          </Typography>
          <Button variant="contained" onClick={() => clearError()}>
            Crear factura
          </Button>
        </Box>
      );
    }
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {invoice?.status && (
        <Box mb={2} display="flex" alignItems="center" gap={2}>
          <Chip
            label={invoice.status === "PAGADA" ? "Pagada" : "Pendiente"}
            color={invoice.status === "PAGADA" ? "success" : "warning"}
          />
          {!isCreateMode && (
            <Button startIcon={<DownloadIcon />} onClick={() => window.print()}>
              Descargar factura
            </Button>
          )}
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

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Datos de la Factura" />
        <Tab label="Pagos" disabled={isCreateMode} />
      </Tabs>

      {activeTab === 0 && (
        <Box sx={{ mt: 2 }}>
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
                onChange={handleClientChange}
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
                {invoice?.clientPhone && (
                  <TextField
                    label="Teléfono"
                    value={invoice.clientPhone}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                )}
                {invoice?.clientEmail && (
                  <TextField
                    label="Email"
                    value={invoice.clientEmail}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                )}
                {(clientType || invoice?.clientType) && (
                  <TextField
                    label="Tipo de cliente"
                    value={clientType ?? invoice?.clientType ?? ""}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                )}
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

          {!isTemporalClient && (
            <>
              <ServicesGrid
                services={services}
                onChange={setServices}
                readonly={isReadonly}
                showErrors={showErrors}
              />
              <Divider sx={{ my: 3 }} />
            </>
          )}

          <ProductsGrid
            products={products}
            onChange={setProducts}
            readonly={isReadonly}
            showErrors={showErrors}
          />

          <Divider sx={{ my: 3 }} />

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
            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleCreateClick}
                disabled={saving || !selectedClient}
              >
                {saving ? "Creando..." : "Crear factura"}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {activeTab === 1 && invoice?.id && (
        <PaymentsTab
          invoiceId={invoice.id}
          clientFullName={invoice.clientFullName}
        />
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar creación de factura</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que los datos son correctos? Una vez creada, la factura no se podrá editar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmCreate} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
