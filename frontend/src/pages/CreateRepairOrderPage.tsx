import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { CreateRepairOrderForm } from "@/features/repair-orders/components/CreateRepairOrderForm";

export default function CreateRepairOrderPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/ordenes-trabajo");
  };

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Nueva orden de trabajo
      </Typography>
      <CreateRepairOrderForm onSuccess={handleSuccess} />
    </Box>
  );
}
