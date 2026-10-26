import { useState, useEffect, useCallback } from "react";

import { Box, Typography, TextField, Button, IconButton, Autocomplete, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { productsApi } from "@/api/products";
import { MoneyInput } from "@/components/MoneyInput";
import { formatCurrency } from "@/utils/formatCurrency";

import type { ProductResponse } from "@/types/catalog";

/** Shape shared by estimate and delivery note product lines. */
export interface ProductLine {
  productName: string;
  quantity: number;
  unitPrice: number;
  productId?: number | null;
}

const allowedDecimalKeys = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);
function blockNonNumeric(e: React.KeyboardEvent, allowDecimal = true) {
  if (allowedDecimalKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
  if (/^[0-9]$/.test(e.key)) return;
  if (allowDecimal && (e.key === "." || e.key === ",")) return;
  e.preventDefault();
}

interface ProductLinesGridProps<T extends ProductLine> {
  products: T[];
  onChange: (products: T[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
}

export function ProductLinesGrid<T extends ProductLine>({
  products,
  onChange,
  readonly = false,
  showErrors = false,
}: ProductLinesGridProps<T>) {
  const [catalogProducts, setCatalogProducts] = useState<ProductResponse[]>([]);
  // Stock info of every catalog product a line points to (search results + lines loaded from an existing document)
  const [knownProducts, setKnownProducts] = useState<Record<number, ProductResponse>>({});

  const rememberProducts = useCallback((items: ProductResponse[]) => {
    if (items.length === 0) return;
    setKnownProducts((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.id] = item;
      });
      return next;
    });
  }, []);

  const fetchCatalogProducts = useCallback(async (query?: string) => {
    try {
      const res = await productsApi.search(query, 0, 50);
      setCatalogProducts(res.data.data.content);
      rememberProducts(res.data.data.content);
    } catch {
      // The picker still accepts free text when the catalog cannot be loaded
    }
  }, [rememberProducts]);

  useEffect(() => {
    fetchCatalogProducts();
  }, [fetchCatalogProducts]);

  const missingIds = products
    .map((p) => p.productId)
    .filter((id): id is number => id != null && !knownProducts[id]);
  const missingKey = [...new Set(missingIds)].sort().join(",");

  useEffect(() => {
    if (!missingKey) return;
    const ids = missingKey.split(",").map(Number);
    Promise.allSettled(ids.map((id) => productsApi.getById(id))).then((results) => {
      rememberProducts(
        results
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof productsApi.getById>>> => r.status === "fulfilled")
          .map((r) => r.value.data.data),
      );
    });
  }, [missingKey, rememberProducts]);

  const addProduct = () => {
    onChange([...products, { productName: "", quantity: 1, unitPrice: 0 } as T]);
  };

  const removeProduct = (index: number) => {
    onChange(products.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, changes: Partial<ProductLine>) => {
    const updated = [...products];
    updated[index] = { ...updated[index], ...changes } as T;
    onChange(updated);
  };

  const productsSubtotal = products.reduce(
    (sum, prod) => sum + (Number(prod.quantity) || 0) * (Number(prod.unitPrice) || 0),
    0,
  );

  const stockHint = (prod: T): { text: string; warning: boolean } | null => {
    if (prod.productId == null) {
      return prod.productName.trim() ? { text: "Producto libre: no mueve stock", warning: false } : null;
    }
    const linked = knownProducts[prod.productId];
    if (!linked) return null;
    const available = linked.availableQuantity;
    if ((prod.quantity || 0) > available) {
      return { text: `Supera el stock disponible (${available})`, warning: true };
    }
    return { text: `Disponible: ${available}`, warning: false };
  };

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

      <Box sx={{ p: 2.5 }}>
        {products.length === 0 ? (
          <Box sx={{ py: 2.5, textAlign: "center" }}>
            <Inventory2Icon sx={{ fontSize: 32, color: "grey.300", mb: 1 }} />
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

            {products.map((prod, index) => {
              const nameError = showErrors && !prod.productName.trim();
              const hint = readonly ? null : stockHint(prod);
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
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
                        (opt) => !products.some((p, i) => i !== index && (p.productId === opt.id || p.productName === opt.name))
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
                    onInputChange={(_, value, reason) => {
                      // "reset" fires after an option is picked, with the same stale line: onChange already set it
                      if (reason === "reset") return;
                      // Typing over a catalog product turns the line into free text (it stops moving stock)
                      updateLine(index, { productName: value, productId: null });
                      if (value.length >= 2) fetchCatalogProducts(value);
                    }}
                    onChange={(_, value) => {
                      if (value && typeof value !== "string") {
                        updateLine(index, {
                          productName: value.name,
                          unitPrice: value.unitPrice ?? 0,
                          productId: value.id,
                        });
                      }
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 2 }}>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography
                            variant="caption"
                            color={option.availableQuantity > 0 ? "text.secondary" : "warning.main"}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            Disp.: {option.availableQuantity}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Producto"
                        size="small"
                        error={nameError}
                        helperText={nameError ? "El nombre es obligatorio" : hint?.text}
                        slotProps={{
                          formHelperText: hint?.warning && !nameError ? { sx: { color: "warning.main" } } : undefined,
                        }}
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
                      updateLine(index, { quantity: val === "" ? 0 : Number(val) });
                    }}
                    onKeyDown={(e) => blockNonNumeric(e, false)}
                    disabled={readonly}
                    size="small"
                    sx={{ flex: 1 }}
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    error={showErrors && prod.quantity < 1}
                    helperText={showErrors && prod.quantity < 1 ? "Debe ser al menos 1" : undefined}
                  />
                  <Box sx={{ flex: 1, display: "flex" }}>
                    <MoneyInput
                      label="Precio unitario"
                      value={prod.unitPrice}
                      onChange={(v) => updateLine(index, { unitPrice: v ?? 0 })}
                      disabled={readonly}
                      size="small"
                      fullWidth
                      error={showErrors && prod.unitPrice < 0}
                      helperText={showErrors && prod.unitPrice < 0 ? "No puede ser negativo" : undefined}
                    />
                  </Box>
                  <TextField
                    label="Total"
                    value={formatCurrency((prod.quantity || 0) * (prod.unitPrice || 0))}
                    size="small"
                    sx={{ flex: 1 }}
                    slotProps={{
                      input: { readOnly: true },
                    }}
                  />
                  {!readonly && (
                    <IconButton onClick={() => removeProduct(index)} color="error" size="small" aria-label="Quitar producto" sx={{ mt: 0.5, "&:hover": { bgcolor: "error.light", color: "white" } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>

      {products.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Subtotal productos:
          </Typography>
          <Typography variant="subtitle2" sx={{ flex: 1, textAlign: "right", fontSize: "0.9rem" }}>
            {formatCurrency(productsSubtotal)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
