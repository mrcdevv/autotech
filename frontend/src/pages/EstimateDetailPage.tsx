import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useParams, useNavigate } from "react-router";

import { EstimateDetail } from "@/features/estimates/components/EstimateDetail";

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "nuevo";
  const estimateId = isNew ? undefined : Number(id);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/presupuestos")}>
          Volver
        </Button>
        <Typography variant="h4">
          {isNew ? "Nuevo presupuesto" : `Presupuesto #${id}`}
        </Typography>
      </Box>
      <EstimateDetail estimateId={estimateId} />
    </Box>
  );
}
