import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { CreateRepairOrderForm } from "@/features/repair-orders/components/CreateRepairOrderForm";

export default function CreateRepairOrderPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/ordenes-trabajo");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Nueva Orden de Trabajo
      </Typography>
      <CreateRepairOrderForm onSuccess={handleSuccess} />
    </Box>
  );
}
