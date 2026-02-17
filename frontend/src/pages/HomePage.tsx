import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import BuildIcon from "@mui/icons-material/Build";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveIcon from "@mui/icons-material/Save";

const stats = [
  { label: "Ordenes activas", value: 12, icon: <BuildIcon fontSize="large" color="primary" /> },
  { label: "Clientes registrados", value: 48, icon: <PeopleIcon fontSize="large" color="primary" /> },
  { label: "Vehiculos en taller", value: 7, icon: <DirectionsCarIcon fontSize="large" color="primary" /> },
  { label: "Facturas pendientes", value: 3, icon: <ReceiptLongIcon fontSize="large" color="secondary" /> },
];

export default function HomePage() {
  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Bienvenido a Autotech
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Sistema de gestion de taller mecanico
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        La integracion con MUI está funcionando correctamente. Este componente
        utiliza: Typography, Card, Grid, Button, Alert, Chip, Stack e iconos de
        @mui/icons-material.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  {stat.icon}
                  <Box>
                    <Typography variant="h5">{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip label="MUI v6" color="primary" />
        <Chip label="React 19" color="secondary" />
        <Chip label="TypeScript" variant="outlined" />
        <Chip label="Vite" variant="outlined" />
      </Stack>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary">
          Componente MUI funcional
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          onClick={() => console.log("Guardado!")}
        >
          Guardar
        </Button>
      </Stack>
    </Box>
  );
}
