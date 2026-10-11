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
    <PageShell title={isNew ? "Nueva factura" : `Factura #${id}`}>
      <InvoiceDetail
        invoiceId={invoiceId}
        estimateId={estimateId}
        onBack={() => navigate("/facturas")}
      />
    </PageShell>
  );
}
