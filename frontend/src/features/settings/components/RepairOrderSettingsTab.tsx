import { Alert, Box, Typography } from "@mui/material";

export function RepairOrderSettingsTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Órdenes de trabajo
      </Typography>
      <Alert severity="info">
        Todavía no hay configuraciones específicas para órdenes de trabajo.
      </Alert>
    </Box>
  );
}
