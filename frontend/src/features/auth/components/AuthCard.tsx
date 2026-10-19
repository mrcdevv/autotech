import type { ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

interface AuthCardProps {
  subtitle: string;
  children: ReactNode;
}

/** Centered card used by the public authentication screens (forgot / reset password). */
export function AuthCard({ subtitle, children }: AuthCardProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%" }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={0.5} alignItems="center" sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="h3" component="h1">
              Autotech
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
