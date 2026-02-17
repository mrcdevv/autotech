import { Paper, Box, Typography, Chip, Skeleton } from "@mui/material";

import { RepairOrderCard } from "./RepairOrderCard";

import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface KanbanColumnProps {
  title: string;
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function KanbanColumn({ title, orders, loading, onUpdateStatus }: KanbanColumnProps) {
  return (
    <Paper sx={{ flex: 1, minWidth: 320, maxWidth: 400, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <Chip label={orders.length} size="small" />
      </Box>
      <Box sx={{ overflowY: "auto", maxHeight: "calc(100vh - 250px)" }}>
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={120} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
          </>
        ) : orders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Sin órdenes
          </Typography>
        ) : (
          orders.map((order) => (
            <RepairOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
          ))
        )}
      </Box>
    </Paper>
  );
}
