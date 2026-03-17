import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate, useSearchParams } from "react-router";

import { InvoiceDetail } from "@/features/invoices/components/InvoiceDetail";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isNew = id === "nuevo";
  const invoiceId = isNew ? undefined : Number(id);
  const estimateId = searchParams.get("estimateId")
    ? Number(searchParams.get("estimateId"))
    : undefined;

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/facturas")} size="small">
          Volver
        </Button>
        <Typography variant="h3">
          {isNew ? "Nueva factura" : `Factura #${id}`}
        </Typography>
      </Box>
      <InvoiceDetail invoiceId={invoiceId} estimateId={estimateId} />
    </Box>
  );
}
