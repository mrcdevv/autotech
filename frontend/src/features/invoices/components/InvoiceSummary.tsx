import { Box, Typography, TextField, InputAdornment } from "@mui/material";

interface InvoiceSummaryProps {
  servicesSubtotal: number;
  productsSubtotal: number;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
}

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
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Resumen
      </Typography>
      <Box display="flex" flexDirection="column" gap={1.5} maxWidth={400}>
        <Typography>
          Total (servicios + productos): ${subtotal.toFixed(2)}
        </Typography>
        <TextField
          type="number"
          label="Descuento (%)"
          value={discountPercentage}
          onChange={(e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));
            onDiscountChange(val);
          }}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            },
            htmlInput: { min: 0, max: 100, step: "0.01" },
          }}
          disabled={readonly}
          size="small"
        />
        <TextField
          type="number"
          label="Impuesto (%)"
          value={taxPercentage}
          onChange={(e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));
            onTaxChange(val);
          }}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            },
            htmlInput: { min: 0, max: 100, step: "0.01" },
          }}
          disabled={readonly}
          size="small"
        />
        <Typography variant="h6">Precio final: ${finalPrice.toFixed(2)}</Typography>
      </Box>
    </Box>
  );
}
