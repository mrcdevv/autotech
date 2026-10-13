import { Box, Typography, Divider, Paper } from "@mui/material";

import { formatCurrency } from "@/utils/formatCurrency";
import type { PaymentSummaryResponse } from "@/types/payment";

interface PaymentSummaryProps {
  summary: PaymentSummaryResponse | null;
}

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
          <Typography sx={{ textAlign: "right" }}>{formatCurrency(summary.totalServices)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total en partes:</Typography>
          <Typography sx={{ textAlign: "right" }}>{formatCurrency(summary.totalProducts)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Impuestos:</Typography>
          <Typography sx={{ textAlign: "right" }}>{formatCurrency(summary.taxAmount)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Descuento:</Typography>
          <Typography sx={{ textAlign: "right" }}>-{formatCurrency(summary.discountAmount)}</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Total:
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ textAlign: "right" }}>
            {formatCurrency(summary.total)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Total pagado a la fecha:</Typography>
          <Typography color="success.main" sx={{ textAlign: "right" }}>
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
            sx={{ textAlign: "right" }}
          >
            {formatCurrency(summary.remaining)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
