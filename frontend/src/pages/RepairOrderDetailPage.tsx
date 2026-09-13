import { useState, useEffect } from "react";

import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import { useParams } from "react-router";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
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
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <PageShell title={`Orden de trabajo #${id}`}>
      <PageToolbar
        filters={
          <TextField
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            variant="outlined"
            fullWidth
            inputProps={{ maxLength: 255 }}
            placeholder="Ingrese un título para la orden de trabajo"
            sx={{ width: { xs: "100%", md: 520 } }}
          />
        }
        actions={
          <Button variant="contained" onClick={handleSaveTitle} sx={{ minWidth: 120 }}>
            Guardar
          </Button>
        }
      />

      {order && (
        <Card elevation={0} sx={{ mb: 2, border: 1, borderColor: "divider", bgcolor: "grey.50" }}>
          <CardContent sx={{ py: 1.5, px: 2.5, "&:last-child": { pb: 1.5 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <PersonIcon color="primary" sx={{ fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {`${order.clientFirstName} ${order.clientLastName}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    DNI: {order.clientDni || "—"} • Tel: {order.clientPhone || "—"}
                    {order.clientEmail && ` • ${order.clientEmail}`}
                  </Typography>
                </Box>
              </Stack>

              <Divider orientation="vertical" flexItem />

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <DirectionsCarIcon color="primary" sx={{ fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {order.vehiclePlate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[order.vehicleYear, order.vehicleBrandName, order.vehicleModel]
                      .filter(Boolean)
                      .join(" ") || "—"}
                    {order.vehicleChassisNumber && ` • VIN: ${order.vehicleChassisNumber}`}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      <RepairOrderDetailTabs order={order} loading={loading} onRefetch={refetch} />
    </PageShell>
  );
}
