import { Box, Button, CircularProgress, Alert, Card, CardContent } from "@mui/material";
import Grid from "@mui/material/Grid2";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TimerIcon from "@mui/icons-material/Timer";
import { useProductividad } from "@/features/dashboard/hooks/useProductividad";
import { KpiCard } from "./KpiCard";
import { MechanicProductivityTable } from "./MechanicProductivityTable";
import { TopServicesTable } from "./TopServicesTable";

export function ProductividadTab() {
  const { data, loading, error, exportToExcel } = useProductividad();

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={exportToExcel}
        >
          Exportar a Excel
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard
            title="Tiempo promedio de reparación"
            value={`${data.averageRepairDays.toFixed(1)} días`}
            icon={<TimerIcon color="primary" fontSize="large" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <MechanicProductivityTable data={data.mechanicProductivity} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <TopServicesTable data={data.topServices} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
