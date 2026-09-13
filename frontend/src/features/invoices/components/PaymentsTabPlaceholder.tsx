import { Box, Typography } from "@mui/material";

interface PaymentsTabPlaceholderProps {
  invoiceId?: number;
}

export function PaymentsTabPlaceholder({ invoiceId: _invoiceId }: PaymentsTabPlaceholderProps) {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Pagos — Próximamente
      </Typography>
      <Typography color="text.secondary">
        La gestión de pagos para esta factura estará disponible pronto.
      </Typography>
    </Box>
  );
}
