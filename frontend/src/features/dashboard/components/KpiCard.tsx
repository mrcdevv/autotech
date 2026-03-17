import { Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {icon}
          <Stack>
            <Typography variant="h5" data-testid="kpi-value">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
