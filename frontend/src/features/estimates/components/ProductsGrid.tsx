import { useState, useEffect, useCallback } from "react";

import { Box, Typography, TextField, Button, IconButton, Autocomplete, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { productsApi } from "@/api/products";

import type { EstimateProductRequest } from "@/types/estimate";
import type { ProductResponse } from "@/types/catalog";

const allowedDecimalKeys = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);
function blockNonNumeric(e: React.KeyboardEvent, allowDecimal = true) {
  if (allowedDecimalKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
  if (/^[0-9]$/.test(e.key)) return;
  if (allowDecimal && (e.key === "." || e.key === ",")) return;
  e.preventDefault();
}

interface ProductsGridProps {
  products: EstimateProductRequest[];
  onChange: (products: EstimateProductRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductsGrid({ products, onChange, readonly = false, showErrors = false }: ProductsGridProps) {
  const [catalogProducts, setCatalogProducts] = useState<ProductResponse[]>([]);

  const fetchCatalogProducts = useCallback(async (query?: string) => {
    try {
      const res = await productsApi.search(query, 0, 50);
      setCatalogProducts(res.data.data.content);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCatalogProducts();
  }, [fetchCatalogProducts]);

  const addProduct = () => {
    onChange([...products, { productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeProduct = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateProduct = (index: number, field: keyof EstimateProductRequest, value: string | number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value } as EstimateProductRequest;
    onChange(updated);
  };

  const productsSubtotal = products.reduce(
    (sum, prod) => sum + (Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0),
    0,
  );

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
          <Inventory2Icon sx={{ color: "primary.main", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
            Productos
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: "primary.main", color: "white", px: 1, py: 0.25, borderRadius: 1, fontSize: "0.7rem", fontWeight: 600 }}>
            {products.length}
          </Typography>
        </Box>
        {!readonly && (
          <Button onClick={addProduct} startIcon={<AddIcon />} size="small" variant="outlined">
            Agregar
          </Button>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {products.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Inventory2Icon sx={{ fontSize: 40, color: "grey.300", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay productos agregados
            </Typography>
            {!readonly && (
              <Typography variant="caption" color="text.secondary">
                Hacé clic en "Agregar" para añadir un producto
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
                Producto
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                Cantidad
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                Precio unit.
              </Typography>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>
                Total
              </Typography>
              {!readonly && <Box sx={{ width: 36 }} />}
            </Box>

            {products.map((prod, index) => (
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
                  options={catalogProducts}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  filterOptions={(options, state) => {
                    const filtered = options.filter(
                      (opt) => !products.some((p, i) => i !== index && p.productName === opt.name)
                    );
                    if (state.inputValue) {
                      return filtered.filter((opt) =>
                        opt.name.toLowerCase().includes(state.inputValue.toLowerCase())
                      );
                    }
                    return filtered;
                  }}
                  onOpen={() => {
                    if (!prod.productName) {
                      fetchCatalogProducts("");
                    }
                  }}
                  inputValue={prod.productName}
                  onInputChange={(_, value) => {
                    updateProduct(index, "productName", value);
                    if (value.length >= 2) fetchCatalogProducts(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== "string") {
                      const updated = [...products];
                      updated[index] = {
                        productName: value.name,
                        quantity: prod.quantity,
                        unitPrice: value.unitPrice ?? 0,
                      };
                      onChange(updated);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Producto"
                      size="small"
                      error={showErrors && !prod.productName.trim()}
                      helperText={showErrors && !prod.productName.trim() ? "El nombre es obligatorio" : undefined}
                    />
                  )}
                  disabled={readonly}
                  sx={{ flex: 2 }}
                />
                <TextField
                  type="number"
                  label="Cantidad"
                  value={prod.quantity === 0 ? "" : prod.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateProduct(index, "quantity", val === "" ? 0 : Number(val));
                  }}
                  onKeyDown={(e) => blockNonNumeric(e, false)}
                  disabled={readonly}
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  error={showErrors && prod.quantity < 1}
                  helperText={showErrors && prod.quantity < 1 ? "Debe ser al menos 1" : undefined}
                />
                <TextField
                  type="number"
                  label="Precio unitario"
                  value={prod.unitPrice === 0 ? "" : prod.unitPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateProduct(index, "unitPrice", val === "" ? 0 : Number(val));
                  }}
                  onKeyDown={(e) => blockNonNumeric(e)}
                  slotProps={{
                    htmlInput: { min: 0, step: "0.01" },
                  }}
                  disabled={readonly}
                  size="small"
                  sx={{ flex: 1 }}
                  error={showErrors && prod.unitPrice < 0}
                  helperText={showErrors && prod.unitPrice < 0 ? "No puede ser negativo" : undefined}
                />
                <TextField
                  label="Total"
                  value={`$ ${formatCurrency((prod.quantity || 0) * (prod.unitPrice || 0))}`}
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{
                    input: { readOnly: true },
                  }}
                />
                {!readonly && (
                  <IconButton onClick={() => removeProduct(index)} color="error" size="small" sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </>
        )}
      </Box>

      {products.length > 0 && (
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
            Subtotal productos:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
            $ {formatCurrency(productsSubtotal)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
