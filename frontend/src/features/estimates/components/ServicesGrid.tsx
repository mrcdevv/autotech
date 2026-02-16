import { useState, useEffect, useCallback } from "react";

import { Box, Typography, TextField, Button, IconButton, Autocomplete } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { catalogServicesApi } from "@/api/catalogServices";

import type { EstimateServiceItemRequest } from "@/types/estimate";
import type { CatalogServiceResponse } from "@/types/catalog";

interface ServicesGridProps {
  services: EstimateServiceItemRequest[];
  onChange: (services: EstimateServiceItemRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
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

  const updateService = (index: number, field: keyof EstimateServiceItemRequest, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value } as EstimateServiceItemRequest;
    onChange(updated);
  };

  const servicesSubtotal = services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Servicios
      </Typography>
      {services.map((svc, index) => (
        <Box key={index} display="flex" gap={2} alignItems="center" mb={1}>
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
            value={svc.price}
            onChange={(e) => updateService(index, "price", Number(e.target.value))}
            disabled={readonly}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            error={showErrors && svc.price < 0}
            helperText={showErrors && svc.price < 0 ? "No puede ser negativo" : undefined}
          />
          {!readonly && (
            <IconButton onClick={() => removeService(index)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {!readonly && (
        <Button onClick={addService} startIcon={<AddIcon />} sx={{ mt: 1 }}>
          Agregar servicio
        </Button>
      )}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Subtotal servicios: ${servicesSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
