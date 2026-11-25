import { Link as RouterLink } from "react-router";
import { Box, Button, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        textAlign: "center",
        px: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: { xs: "4rem", sm: "6rem" }, fontWeight: 700, color: "text.secondary" }}>
        404
      </Typography>
      <Typography variant="h5" component="h2">
        Página no encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary">
        La página que buscás no existe o fue movida.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" startIcon={<HomeOutlinedIcon />}>
        Volver al inicio
      </Button>
    </Box>
  );
}
