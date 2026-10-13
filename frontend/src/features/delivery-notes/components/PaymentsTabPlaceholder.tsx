import { Box, Typography } from "@mui/material";

interface PaymentsTabPlaceholderProps {
  deliveryNoteId?: number;
}

export function PaymentsTabPlaceholder({ deliveryNoteId: _deliveryNoteId }: PaymentsTabPlaceholderProps) {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Pagos — Próximamente
      </Typography>
      <Typography color="text.secondary">
        La gestión de pagos para esta remito estará disponible pronto.
      </Typography>
    </Box>
  );
}
