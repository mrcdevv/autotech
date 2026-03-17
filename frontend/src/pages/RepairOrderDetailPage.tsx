import { useState, useEffect } from "react";

import { Box, TextField, Button, CircularProgress, Typography } from "@mui/material";
import { useParams } from "react-router";

import { RepairOrderDetailTabs } from "@/features/repair-orders/components/RepairOrderDetailTabs";
import { useRepairOrder } from "@/features/repair-orders/hooks/useRepairOrder";

export default function RepairOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error, refetch, updateTitle } = useRepairOrder(Number(id));

  const [editableTitle, setEditableTitle] = useState("");

  useEffect(() => {
    if (order?.title) {
      setEditableTitle(order.title);
    }
  }, [order?.title]);

  const handleSaveTitle = async () => {
    if (editableTitle.trim()) {
      await updateTitle({ title: editableTitle.trim() });
    }
  };

  if (loading && !order) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          variant="outlined"
          fullWidth
          inputProps={{ maxLength: 255 }}
        />
        <Button variant="contained" onClick={handleSaveTitle}>
          Guardar
        </Button>
      </Box>
      <RepairOrderDetailTabs order={order} loading={loading} onRefetch={refetch} />
    </Box>
  );
}
