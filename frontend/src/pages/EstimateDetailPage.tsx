import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router";

import { PageShell } from "@/components/PageShell";
import { EstimateDetail } from "@/features/estimates/components/EstimateDetail";

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "nuevo";
  const estimateId = isNew ? undefined : Number(id);

  return (
    <PageShell
      title={isNew ? "Nuevo presupuesto" : `Presupuesto #${id}`}
      actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/presupuestos")}
          size="small"
        >
          Volver
        </Button>
      }
    >
      <EstimateDetail estimateId={estimateId} />
    </PageShell>
  );
}
