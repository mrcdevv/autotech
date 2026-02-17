import { Box } from "@mui/material";

import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_COLUMNS } from "../types";

import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface KanbanBoardProps {
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
}

export function KanbanBoard({ orders, loading, onUpdateStatus }: KanbanBoardProps) {
  const groupedOrders = KANBAN_COLUMNS.map((col) => ({
    ...col,
    orders: orders
      .filter((o) => col.statuses.includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }));

  return (
    <Box display="flex" gap={2} sx={{ overflowX: "auto", minHeight: "70vh" }}>
      {groupedOrders.map((col) => (
        <KanbanColumn
          key={col.title}
          title={col.title}
          orders={col.orders}
          loading={loading}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </Box>
  );
}
