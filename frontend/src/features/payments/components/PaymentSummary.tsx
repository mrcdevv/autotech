import { Box, Typography, Divider, Paper } from "@mui/material";

import type { PaymentSummaryResponse } from "@/types/payment";

interface PaymentSummaryProps {
  summary: PaymentSummaryResponse | null;
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

export function PaymentSummary({ summary }: PaymentSummaryProps) {
  if (!summary) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Resumen de pagos
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total en servicios:</Typography>
          <Typography>{formatCurrency(summary.totalServices)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total en partes:</Typography>
          <Typography>{formatCurrency(summary.totalProducts)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Impuestos:</Typography>
          <Typography>{formatCurrency(summary.taxAmount)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Descuento:</Typography>
          <Typography>-{formatCurrency(summary.discountAmount)}</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Total:
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            {formatCurrency(summary.total)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total pagado a la fecha:</Typography>
          <Typography color="success.main">
            {formatCurrency(summary.totalPaid)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Restante por pagar:
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color={summary.remaining > 0 ? "error.main" : "success.main"}
          >
            {formatCurrency(summary.remaining)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
