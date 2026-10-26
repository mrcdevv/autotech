import { Box, Stack, Typography } from "@mui/material";

import type { ReactNode } from "react";

interface SettingsSectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ id, title, subtitle, icon, children }: SettingsSectionProps) {
  return (
    <Box component="section" id={id}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="h5">{title}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}
