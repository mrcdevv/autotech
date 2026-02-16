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
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/facturas")}>
          Volver
        </Button>
        <Typography variant="h4">
          {isNew ? "Nueva factura" : `Factura #${id}`}
        </Typography>
      </Box>
      <InvoiceDetail invoiceId={invoiceId} estimateId={estimateId} />
    </Box>
  );
}
