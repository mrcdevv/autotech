import { useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import AddIcon from "@mui/icons-material/Add";

import { useRepairOrderInspections } from "@/features/inspections/useRepairOrderInspections";
import { InspectionForm } from "@/features/inspections/InspectionForm";
import { AddInspectionDialog } from "@/features/inspections/AddInspectionDialog";
import { inspectionsApi } from "@/api/inspections";
import { repairOrdersApi } from "@/api/repairOrders";

interface InspectionsTabProps {
  repairOrderId: number;
  reason: string | null;
  mechanicNotes: string | null;
  onRepairOrderUpdated: () => void;
  clientFirstName: string;
  clientLastName: string;
  clientDni: string | null;
  vehiclePlate: string;
  vehicleBrandName: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
}

export function InspectionsTab({
  repairOrderId,
  reason,
  mechanicNotes,
  onRepairOrderUpdated,
  clientFirstName,
  clientLastName,
  clientDni,
  vehiclePlate,
  vehicleBrandName,
  vehicleModel,
  vehicleYear,
}: InspectionsTabProps) {
  const { inspections, loading, error, refetch } = useRepairOrderInspections(repairOrderId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localReason, setLocalReason] = useState(reason ?? "");
  const [localNotes, setLocalNotes] = useState(mechanicNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveReasonAndNotes = async () => {
    setSavingNotes(true);
    try {
      await repairOrdersApi.updateNotes(repairOrderId, {
        reason: localReason || null,
        mechanicNotes: localNotes || null,
      });
      showSnackbar("Motivo y notas guardados", "success");
      onRepairOrderUpdated();
    } catch {
      showSnackbar("Error al guardar motivo y notas", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddInspection = async (templateId: number) => {
    try {
      await inspectionsApi.create(repairOrderId, templateId);
      refetch();
      setAddDialogOpen(false);
      showSnackbar("Inspección creada", "success");
    } catch {
      showSnackbar("Error al crear la inspección", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Print-only Header */}
      <Box
        sx={{
          display: "none",
          "@media print": {
            display: "block",
            mb: 4,
            pb: 2,
            borderBottom: "2px solid #000",
          },
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          AUTOTECH
        </Typography>
        <Typography variant="body2" gutterBottom>
          Servicio Mecánico Integral
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
          RESUMEN DE INSPECCIÓN
        </Typography>
        <Typography variant="body2">
          Fecha: {new Date().toLocaleDateString("es-AR")}
        </Typography>
      </Box>

      {/* Print-only Client and Vehicle Info */}
      <Box
        sx={{
          display: "none",
          "@media print": {
            display: "block",
            mb: 3,
            pb: 2,
            borderBottom: "1px solid #ddd",
          },
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              CLIENTE
            </Typography>
            <Typography variant="body1" fontWeight="600">
              {clientFirstName} {clientLastName}
            </Typography>
            {clientDni && <Typography variant="body2">DNI: {clientDni}</Typography>}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              VEHÍCULO
            </Typography>
            <Typography variant="body1" fontWeight="600">
              {[vehicleBrandName, vehicleModel].filter(Boolean).join(" ") || "—"}
            </Typography>
            <Typography variant="body2">Patente: {vehiclePlate}</Typography>
            {vehicleYear && <Typography variant="body2">Año: {vehicleYear}</Typography>}
          </Box>
        </Box>
      </Box>

      {/* Print-only Reason and Notes */}
      {(localReason || localNotes) && (
        <Box
          sx={{
            display: "none",
            "@media print": {
              display: "block",
              mb: 3,
              pb: 2,
              borderBottom: "1px solid #ddd",
            },
          }}
        >
          {localReason && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                MOTIVO DE CONSULTA
              </Typography>
              <Typography variant="body1">{localReason}</Typography>
            </Box>
          )}
          {localNotes && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                NOTAS DEL MECÁNICO
              </Typography>
              <Typography variant="body1">{localNotes}</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Screen-only UI */}
      <Box className="no-print">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Motivo de consulta"
            value={localReason}
            onChange={(e) => setLocalReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            label="Notas del mecánico"
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          <Box>
            <Button variant="outlined" onClick={handleSaveReasonAndNotes} disabled={savingNotes}>
              {savingNotes ? "Guardando..." : "Guardar motivo y notas"}
            </Button>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            disabled={inspections.length === 0}
            onClick={handlePrint}
          >
            Imprimir resumen
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Agregar inspección
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && inspections.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No existen inspecciones
          </Typography>
        )}
      </Box>

      {/* Inspections - visible both on screen and print */}
      {inspections.map((inspection) => (
        <InspectionForm
          key={inspection.id}
          repairOrderId={repairOrderId}
          inspection={inspection}
          onSaved={() => {
            refetch();
            showSnackbar("Inspección guardada", "success");
          }}
          onDeleted={() => {
            refetch();
            showSnackbar("Inspección eliminada", "success");
          }}
        />
      ))}

      <AddInspectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSelect={handleAddInspection}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
