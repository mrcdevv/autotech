import { Box, Typography, TextField, InputAdornment, Paper, Stack, Divider } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const allowedDecimalKeys = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);
function blockNonNumeric(e: React.KeyboardEvent) {
  if (allowedDecimalKeys.has(e.key) || e.ctrlKey || e.metaKey) return;
  if (/^[0-9]$/.test(e.key)) return;
  if (e.key === "." || e.key === ",") return;
  e.preventDefault();
}

interface InvoiceSummaryProps {
  servicesSubtotal: number;
  productsSubtotal: number;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const percentageRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const percentageLabelSx = {
  width: 100,
  flexShrink: 0,
  whiteSpace: "nowrap",
};

export function InvoiceSummary({
  servicesSubtotal,
  productsSubtotal,
  discountPercentage,
  taxPercentage,
  onDiscountChange,
  onTaxChange,
  readonly = false,
}: InvoiceSummaryProps) {
  const subtotal = servicesSubtotal + productsSubtotal;
  const discountAmount = subtotal * (discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercentage / 100);
  const finalPrice = afterDiscount + taxAmount;

  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <ReceiptLongIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ fontSize: "0.9rem" }}>
          Resumen
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Subtotal servicios</Typography>
            <Typography variant="body2">$ {formatCurrency(servicesSubtotal)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Subtotal productos</Typography>
            <Typography variant="body2">$ {formatCurrency(productsSubtotal)}</Typography>
          </Box>

          <Divider />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight={500}>Subtotal</Typography>
            <Typography variant="body2" fontWeight={500}>$ {formatCurrency(subtotal)}</Typography>
          </Box>

          <Box sx={percentageRowSx}>
            <Typography variant="body2" color="text.secondary" sx={percentageLabelSx}>
              Descuento
            </Typography>
            <TextField
              type="number"
              value={discountPercentage === 0 ? "" : discountPercentage}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value)));
                onDiscountChange(val);
              }}
              onKeyDown={blockNonNumeric}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { "aria-label": "Descuento (%)", min: 0, max: 100, step: "0.01" },
              }}
              disabled={readonly}
              size="small"
              sx={{ width: 120 }}
            />
            {discountPercentage > 0 && (
              <Typography variant="body2" color="error.main" sx={{ ml: "auto" }}>
                - $ {formatCurrency(discountAmount)}
              </Typography>
            )}
          </Box>

          <Box sx={percentageRowSx}>
            <Typography variant="body2" color="text.secondary" sx={percentageLabelSx}>
              Impuesto
            </Typography>
            <TextField
              type="number"
              value={taxPercentage === 0 ? "" : taxPercentage}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value)));
                onTaxChange(val);
              }}
              onKeyDown={blockNonNumeric}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { "aria-label": "Impuesto (%)", min: 0, max: 100, step: "0.01" },
              }}
              disabled={readonly}
              size="small"
              sx={{ width: 120 }}
            />
            {taxPercentage > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                + $ {formatCurrency(taxAmount)}
              </Typography>
            )}
          </Box>

          <Divider />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 1, px: 2, bgcolor: "primary.main", borderRadius: 1.5, mx: -1 }}
          >
            <Typography variant="subtitle1" sx={{ color: "primary.contrastText", fontWeight: 600 }}>
              Total
            </Typography>
            <Typography variant="h5" sx={{ color: "primary.contrastText", fontWeight: 700 }}>
              $ {formatCurrency(finalPrice)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
