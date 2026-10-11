import { Box, Typography, Skeleton, Stack } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { StatusDot } from "@/components/StatusDot";
import { dot } from "@/theme/tokens";

import { RepairOrderCard } from "./RepairOrderCard";

import type { StatusTone } from "@/theme/tokens";
import type { RepairOrderResponse, StatusUpdateRequest } from "../types";

interface KanbanColumnProps {
  title: string;
  tone: StatusTone;
  orders: RepairOrderResponse[];
  loading: boolean;
  onUpdateStatus: (id: number, request: StatusUpdateRequest) => Promise<void>;
  onRefetch: () => void;
}

export function KanbanColumn({ title, tone, orders, loading, onUpdateStatus, onRefetch }: KanbanColumnProps) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.100",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <StatusDot label="" color={dot[tone]} />
          <Typography variant="overline" sx={{ color: "text.muted" }}>
            {title}
          </Typography>
        </Box>
        <MonoText
          sx={{
            fontSize: "0.6875rem",
            color: "text.secondary",
            border: "1px solid",
            borderColor: "divider",
            px: "7px",
            py: "1px",
          }}
        >
          {orders.length}
        </MonoText>
      </Box>

      <Stack spacing={1.25} sx={{ p: 1.25 }}>
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
          </>
        ) : orders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Sin órdenes
          </Typography>
        ) : (
          orders.map((order) => (
            <RepairOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={onUpdateStatus}
              onRefetch={onRefetch}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}
