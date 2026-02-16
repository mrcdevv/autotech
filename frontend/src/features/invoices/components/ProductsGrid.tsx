import { useState, useEffect, useCallback } from "react";

import { Box, Typography, TextField, Button, IconButton, Autocomplete } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { productsApi } from "@/api/products";

import type { InvoiceProductRequest } from "@/types/invoice";
import type { ProductResponse } from "@/types/catalog";

interface ProductsGridProps {
  products: InvoiceProductRequest[];
  onChange: (products: InvoiceProductRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
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

  const updateProduct = (index: number, field: keyof InvoiceProductRequest, value: string | number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value } as InvoiceProductRequest;
    onChange(updated);
  };

  const productsSubtotal = products.reduce(
    (sum, prod) => sum + (Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0),
    0,
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Productos
      </Typography>
      {products.map((prod, index) => (
        <Box key={index} display="flex" gap={2} alignItems="center" mb={1}>
          <Autocomplete
            freeSolo
            options={catalogProducts}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
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
            value={prod.quantity}
            onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))}
            disabled={readonly}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={showErrors && prod.quantity < 1}
            helperText={showErrors && prod.quantity < 1 ? "Debe ser al menos 1" : undefined}
          />
          <TextField
            type="number"
            label="Precio unitario"
            value={prod.unitPrice}
            onChange={(e) => updateProduct(index, "unitPrice", Number(e.target.value))}
            disabled={readonly}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            error={showErrors && prod.unitPrice < 0}
            helperText={showErrors && prod.unitPrice < 0 ? "No puede ser negativo" : undefined}
          />
          <TextField
            label="Precio total"
            value={((Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0)).toFixed(2)}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{
              input: { readOnly: true, startAdornment: "$" },
            }}
          />
          {!readonly && (
            <IconButton onClick={() => removeProduct(index)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {!readonly && (
        <Button onClick={addProduct} startIcon={<AddIcon />} sx={{ mt: 1 }}>
          Agregar producto
        </Button>
      )}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Subtotal productos: ${productsSubtotal.toFixed(2)}
      </Typography>
    </Box>
  );
}
