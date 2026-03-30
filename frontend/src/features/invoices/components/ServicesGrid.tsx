import { useState, useEffect, useCallback } from "react";

import { Box, Typography, TextField, Button, IconButton, Autocomplete, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildIcon from "@mui/icons-material/Build";

import { catalogServicesApi } from "@/api/catalogServices";

import type { InvoiceServiceItemRequest } from "@/types/invoice";
import type { CatalogServiceResponse } from "@/types/catalog";

const allowedDecimalKeys = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);
function blockNonNumeric(e: React.KeyboardEvent, allowDecimal = true) {
  if (allowedDecimalKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
  if (/^[0-9]$/.test(e.key)) return;
  if (allowDecimal && (e.key === "." || e.key === ",")) return;
  e.preventDefault();
}

interface ServicesGridProps {
  services: InvoiceServiceItemRequest[];
  onChange: (services: InvoiceServiceItemRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ServicesGrid({ services, onChange, readonly = false, showErrors = false }: ServicesGridProps) {
  const [catalogServices, setCatalogServices] = useState<CatalogServiceResponse[]>([]);

  const fetchCatalogServices = useCallback(async (query?: string) => {
    try {
      const res = await catalogServicesApi.search(query, 0, 50);
      setCatalogServices(res.data.data.content);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCatalogServices();
  }, [fetchCatalogServices]);

  const addService = () => {
    onChange([...services, { serviceName: "", price: 0 }]);
  };

  const removeService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateService = (index: number, field: keyof InvoiceServiceItemRequest, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value } as InvoiceServiceItemRequest;
    onChange(updated);
  };

  const servicesSubtotal = services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);

  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <BuildIcon sx={{ color: "primary.main", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
            Servicios
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: "primary.main", color: "white", px: 1, py: 0.25, borderRadius: 1, fontSize: "0.7rem", fontWeight: 600 }}>
            {services.length}
          </Typography>
        </Box>
        {!readonly && (
          <Button onClick={addService} startIcon={<AddIcon />} size="small" variant="outlined">
            Agregar
          </Button>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {services.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <BuildIcon sx={{ fontSize: 40, color: "grey.300", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay servicios agregados
            </Typography>
            {!readonly && (
              <Typography variant="caption" color="text.secondary">
                Hacé clic en "Agregar" para añadir un servicio
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                gap: 2,
                px: 1,
                pb: 1,
                mb: 1,
                borderBottom: 1,
                borderColor: "divider",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" sx={{ flex: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                Servicio
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                Precio
              </Typography>
              {!readonly && <Box sx={{ width: 36 }} />}
            </Box>

            {services.map((svc, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  py: 1,
                  px: 1,
                  borderRadius: 1,
                  transition: "background-color 0.15s",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <Autocomplete
                  freeSolo
                  options={catalogServices}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  inputValue={svc.serviceName}
                  onInputChange={(_, value) => {
                    updateService(index, "serviceName", value);
                    if (value.length >= 2) fetchCatalogServices(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== "string") {
                      const updated = [...services];
                      updated[index] = {
                        serviceName: value.name,
                        price: value.price ?? 0,
                      };
                      onChange(updated);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Servicio"
                      size="small"
                      error={showErrors && !svc.serviceName.trim()}
                      helperText={showErrors && !svc.serviceName.trim() ? "El nombre es obligatorio" : undefined}
                    />
                  )}
                  disabled={readonly}
                  sx={{ flex: 2 }}
                />
                <TextField
                  type="number"
                  label="Precio"
                  value={svc.price === 0 ? "" : svc.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateService(index, "price", val === "" ? 0 : Number(val));
                  }}
                  onKeyDown={(e) => blockNonNumeric(e)}
                  slotProps={{
                    htmlInput: { min: 0, step: "0.01" },
                  }}
                  disabled={readonly}
                  size="small"
                  sx={{ flex: 1 }}
                  error={showErrors && svc.price < 0}
                  helperText={showErrors && svc.price < 0 ? "No puede ser negativo" : undefined}
                />
                {!readonly && (
                  <IconButton onClick={() => removeService(index)} color="error" size="small" sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </>
        )}
      </Box>

      {services.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Subtotal servicios:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
            $ {formatCurrency(servicesSubtotal)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
