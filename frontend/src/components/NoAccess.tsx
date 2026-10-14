import { useNavigate } from "react-router";
import { Box, Button, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export function NoAccess() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1.5,
        minHeight: "50vh",
      }}
    >
      <LockOutlinedIcon sx={{ fontSize: 48, color: "text.secondary" }} />
      <Typography variant="h6">Sin permisos</Typography>
      <Typography color="text.secondary">
        No tiene permisos para acceder a esta sección.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/", { replace: true })}>
        Volver al inicio
      </Button>
    </Box>
  );
}
