import { Box } from "@mui/material";

import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_COLUMNS } from "../types";

import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface KanbanBoardProps {
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
  onRefetch: () => void;
}

export function KanbanBoard({ orders, loading, onUpdateStatus, onRefetch }: KanbanBoardProps) {
  const groupedOrders = KANBAN_COLUMNS.map((col) => ({
    ...col,
    orders: orders
      .filter((o) => col.statuses.includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }));

  return (
    <Box
      display="flex"
      gap={1.5}
      sx={{
        overflowX: "auto",
        alignItems: "flex-start",
        pb: 1,
      }}
    >
      {groupedOrders.map((col) => (
        <KanbanColumn
          key={col.title}
          title={col.title}
          tone={col.tone}
          orders={col.orders}
          loading={loading}
          onUpdateStatus={onUpdateStatus}
          onRefetch={onRefetch}
        />
      ))}
    </Box>
  );
}
