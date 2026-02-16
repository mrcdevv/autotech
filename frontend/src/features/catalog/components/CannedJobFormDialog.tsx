import { useState, useEffect, useCallback, useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
  Stack,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { catalogServicesApi } from "@/api/catalogServices";
import { productsApi } from "@/api/products";

import type {
  CannedJobDetailResponse,
  CannedJobRequest,
  CannedJobServiceRequest,
  CannedJobProductRequest,
  CatalogServiceResponse,
  ProductResponse,
} from "@/types/catalog";

interface CannedJobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CannedJobRequest) => Promise<void>;
  initialData?: CannedJobDetailResponse | null;
}

export function CannedJobFormDialog({ open, onClose, onSave, initialData }: CannedJobFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState<CannedJobServiceRequest[]>([]);
  const [products, setProducts] = useState<CannedJobProductRequest[]>([]);
  const [titleError, setTitleError] = useState(false);

  const [serviceOptions, setServiceOptions] = useState<CatalogServiceResponse[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductResponse[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  const serviceSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description ?? "");
        setServices(initialData.services.map((s) => ({ serviceName: s.serviceName, price: s.price })));
        setProducts(initialData.products.map((p) => ({ productName: p.productName, quantity: p.quantity, unitPrice: p.unitPrice })));
      } else {
        setTitle("");
        setDescription("");
        setServices([]);
        setProducts([]);
      }
      setTitleError(false);
      setServiceOptions([]);
      setProductOptions([]);
    }
  }, [open, initialData]);

  const searchServices = useCallback((query: string) => {
    if (serviceSearchTimer.current) clearTimeout(serviceSearchTimer.current);
    serviceSearchTimer.current = setTimeout(async () => {
      setServiceLoading(true);
      try {
        const res = await catalogServicesApi.search(query || undefined, 0, 20);
        setServiceOptions(res.data.data.content);
      } catch {
        setServiceOptions([]);
      } finally {
        setServiceLoading(false);
      }
    }, 300);
  }, []);

  const searchProducts = useCallback((query: string) => {
    if (productSearchTimer.current) clearTimeout(productSearchTimer.current);
    productSearchTimer.current = setTimeout(async () => {
      setProductLoading(true);
      try {
        const res = await productsApi.search(query || undefined, 0, 20);
        setProductOptions(res.data.data.content);
      } catch {
        setProductOptions([]);
      } finally {
        setProductLoading(false);
      }
    }, 300);
  }, []);

  const handleAddService = () => {
    setServices([...services, { serviceName: "", price: 0 }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, selected: CatalogServiceResponse | null) => {
    if (selected) {
      setServices((prev) =>
        prev.map((item, i) =>
          i === index
            ? { serviceName: selected.name, price: selected.price ?? 0 }
            : item
        )
      );
    }
  };

  const handleServiceFieldChange = (index: number, field: keyof CannedJobServiceRequest, value: string | number) => {
    setServices((prev) =>
      prev.map((item, i) =>
        i === index ? { serviceName: item.serviceName, price: item.price, [field]: value } : item
      )
    );
  };

  const handleAddProduct = () => {
    setProducts([...products, { productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, selected: ProductResponse | null) => {
    if (selected) {
      setProducts((prev) =>
        prev.map((item, i) =>
          i === index
            ? { productName: selected.name, quantity: 1, unitPrice: selected.unitPrice ?? 0 }
            : item
        )
      );
    }
  };

  const handleProductFieldChange = (index: number, field: keyof CannedJobProductRequest, value: string | number) => {
    setProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? { productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, [field]: value }
          : item
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      services,
      products,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? "Editar trabajo enlatado" : "Nuevo trabajo enlatado"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(false);
            }}
            error={titleError}
            helperText={titleError ? "El título es obligatorio" : ""}
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Servicios</Typography>
              <Button startIcon={<AddIcon />} size="small" onClick={handleAddService}>
                Agregar servicio
              </Button>
            </Box>
            {services.map((svc, index) => (
              <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                <Autocomplete
                  freeSolo
                  options={serviceOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  inputValue={svc.serviceName}
                  onInputChange={(_e, value) => {
                    handleServiceFieldChange(index, "serviceName", value);
                    searchServices(value);
                  }}
                  onChange={(_e, value) => {
                    if (value && typeof value !== "string") {
                      handleServiceSelect(index, value);
                    }
                  }}
                  loading={serviceLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nombre del servicio"
                      size="small"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {serviceLoading ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        {option.price != null && (
                          <Typography variant="caption" color="text.secondary">
                            ${option.price.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Precio"
                  type="number"
                  value={svc.price}
                  onFocus={(e) => {
                    if (svc.price === 0) e.target.select();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleServiceFieldChange(index, "price", val === "" ? 0 : parseFloat(val));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />
                <IconButton onClick={() => handleRemoveService(index)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Productos</Typography>
              <Button startIcon={<AddIcon />} size="small" onClick={handleAddProduct}>
                Agregar producto
              </Button>
            </Box>
            {products.map((prod, index) => (
              <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                <Autocomplete
                  freeSolo
                  options={productOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  inputValue={prod.productName}
                  onInputChange={(_e, value) => {
                    handleProductFieldChange(index, "productName", value);
                    searchProducts(value);
                  }}
                  onChange={(_e, value) => {
                    if (value && typeof value !== "string") {
                      handleProductSelect(index, value);
                    }
                  }}
                  loading={productLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nombre del producto"
                      size="small"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productLoading ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        {option.unitPrice != null && (
                          <Typography variant="caption" color="text.secondary">
                            ${option.unitPrice.toFixed(2)} — Stock: {option.quantity}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Cantidad"
                  type="number"
                  value={prod.quantity}
                  onFocus={(e) => {
                    if (prod.quantity === 1) e.target.select();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleProductFieldChange(index, "quantity", val === "" ? 1 : Math.max(1, parseInt(val)));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
                <TextField
                  label="Precio unitario"
                  type="number"
                  value={prod.unitPrice}
                  onFocus={(e) => {
                    if (prod.unitPrice === 0) e.target.select();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleProductFieldChange(index, "unitPrice", val === "" ? 0 : parseFloat(val));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />
                <IconButton onClick={() => handleRemoveProduct(index)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
