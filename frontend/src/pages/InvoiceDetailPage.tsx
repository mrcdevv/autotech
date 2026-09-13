import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate, useSearchParams } from "react-router";

import { PageShell } from "@/components/PageShell";
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
    <PageShell
      title={isNew ? "Nueva factura" : `Factura #${id}`}
      actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/facturas")}
          size="small"
        >
          Volver
        </Button>
      }
    >
      <InvoiceDetail invoiceId={invoiceId} estimateId={estimateId} />
    </PageShell>
  );
}
