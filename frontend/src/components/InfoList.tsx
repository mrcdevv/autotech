import { Box, Stack, Typography } from "@mui/material";

import type { ReactNode } from "react";

export interface InfoListItem {
  label: string;
  value: ReactNode;
}

interface InfoListProps {
  title?: string;
  icon?: ReactNode;
  items: InfoListItem[];
}

export function InfoList({ title, icon, items }: InfoListProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      {title && (
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
          {icon}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Stack>
      )}
      <Stack spacing={1.5}>
        {items.map((item) => (
          <Box key={item.label} sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
              {item.label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary", wordBreak: "break-word" }}>
              {item.value ?? "—"}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
