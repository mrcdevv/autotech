import { useParams, useNavigate, useSearchParams } from "react-router";

import { PageShell } from "@/components/PageShell";
import { DeliveryNoteDetail } from "@/features/delivery-notes/components/DeliveryNoteDetail";

export default function DeliveryNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isNew = id === "nuevo";
  const deliveryNoteId = isNew ? undefined : Number(id);
  const estimateId = searchParams.get("estimateId")
    ? Number(searchParams.get("estimateId"))
    : undefined;

  return (
    <PageShell title={isNew ? "Nueva remito" : `Remito #${id}`}>
      <DeliveryNoteDetail
        deliveryNoteId={deliveryNoteId}
        estimateId={estimateId}
        onBack={() => navigate("/remitos")}
      />
    </PageShell>
  );
}
