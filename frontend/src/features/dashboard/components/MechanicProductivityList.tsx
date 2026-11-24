import { Avatar, Box, Stack, Typography } from "@mui/material";

import { MonoText } from "@/components/MonoText";

import type { MechanicProductivityResponse } from "@/features/dashboard/types";

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface MechanicProductivityListProps {
  mechanics: MechanicProductivityResponse[];
}

export function MechanicProductivityList({ mechanics }: MechanicProductivityListProps) {
  if (mechanics.length === 0) {
    return (
      <Typography color="text.secondary">
        Ninguna orden asignada a un mecánico se entregó en el período.
      </Typography>
    );
  }

  return (
    <Stack>
      {mechanics.map((mechanic) => (
        <Box
          key={mechanic.employeeId}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: "grey.800" }}>
            {initials(mechanic.employeeFullName)}
          </Avatar>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
            {mechanic.employeeFullName}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>
            <MonoText>{mechanic.completedOrders}</MonoText>
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
