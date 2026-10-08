import { Avatar, Card, CardContent, CardHeader } from "@mui/material";

import type { ReactNode } from "react";

interface ConfigCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function ConfigCard({ title, icon, children }: ConfigCardProps) {
  return (
    <Card>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: "primary.main" }}>{icon}</Avatar>}
        title={title}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}
