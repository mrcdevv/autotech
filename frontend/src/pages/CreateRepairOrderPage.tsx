import { useNavigate } from "react-router";

import { PageShell } from "@/components/PageShell";
import { CreateRepairOrderForm } from "@/features/repair-orders/components/CreateRepairOrderForm";

export default function CreateRepairOrderPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/ordenes-trabajo");
  };

  return (
    <PageShell title="Nueva orden de trabajo">
      <CreateRepairOrderForm onSuccess={handleSuccess} />
    </PageShell>
  );
}
