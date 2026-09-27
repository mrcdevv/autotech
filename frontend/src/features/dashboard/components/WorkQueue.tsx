import { Box, Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";
import { Panel } from "@/components/Panel";
import { PanelLink } from "@/components/PanelLink";
import { PanelRow } from "@/components/PanelRow";
import { RowText } from "@/components/RowText";
import { StatusDot } from "@/components/StatusDot";
import type { QueueItemView } from "@/features/dashboard/utils/homeView";

interface WorkQueueProps {
  items: QueueItemView[];
  onViewOrders: () => void;
}

export function WorkQueue({ items, onViewOrders }: WorkQueueProps) {
  return (
    <Panel
      testId="work-queue"
      title="Cola de trabajo"
      action={<PanelLink onClick={onViewOrders}>Ver órdenes →</PanelLink>}
      contentSx={{ mt: "6px" }}
    >
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          No hay órdenes en curso
        </Typography>
      ) : (
        items.map((item) => (
          <PanelRow key={item.ot}>
            <MonoText
              sx={{ fontSize: "0.6875rem", color: "primary.main", width: 40, flex: "none" }}
            >
              {item.ot}
            </MonoText>
            <RowText
              primary={
                <>
                  {item.client}{" "}
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                    · {item.vehicle}
                  </Box>
                </>
              }
              secondary={item.task}
            />
            <StatusDot label={item.status} color={item.color} />
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
