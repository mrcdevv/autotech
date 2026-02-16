import { Box, Typography } from "@mui/material";

export function PlaceholderTab() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={300}
      sx={{ mt: 4 }}
    >
      <Typography variant="h6" color="text.secondary">
        Próximamente
      </Typography>
    </Box>
  );
}
