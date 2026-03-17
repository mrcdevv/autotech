import { Box, Typography } from "@mui/material";

import { TagsManager } from "@/features/settings/components/TagsManager";

export function RepairOrderSettingsTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Etiquetas
      </Typography>
      <TagsManager />
    </Box>
  );
}
