import { Avatar, Card, CardContent, CardHeader } from "@mui/material";

import type { ReactNode } from "react";

interface ConfigCardProps {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function ConfigCard({ title, icon, action, children }: ConfigCardProps) {
  return (
    <Card>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: "primary.main" }}>{icon}</Avatar>}
        title={title}
        action={action}
        sx={{ "& .MuiCardHeader-action": { alignSelf: "center", m: 0 } }}
      />
      <CardContent sx={{ pt: 0 }}>{children}</CardContent>
    </Card>
  );
}
