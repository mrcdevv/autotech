import { useState } from "react";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";

import { inspectionsApi } from "@/api/inspections";

import type { InspectionResponse, InspectionItemStatus, InspectionItemRequest } from "@/features/inspections/types";

interface InspectionFormProps {
  repairOrderId: number;
  inspection: InspectionResponse;
  onSaved: () => void;
  onDeleted: () => void;
}

export function InspectionForm({
  repairOrderId,
  inspection,
  onSaved,
  onDeleted,
}: InspectionFormProps) {
  const [itemStates, setItemStates] = useState<
    Record<number, { status: InspectionItemStatus; comment: string | null }>
  >(() => {
    const map: Record<number, { status: InspectionItemStatus; comment: string | null }> = {};
    inspection.groups.forEach((group) => {
      group.items.forEach((item) => {
        map[item.id] = { status: item.status, comment: item.comment };
      });
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStatusChange = (itemId: number, status: InspectionItemStatus) => {
    setItemStates((prev) => {
      const existing = prev[itemId] ?? { status: "NO_APLICA" as InspectionItemStatus, comment: null };
      return { ...prev, [itemId]: { ...existing, status } };
    });
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    setItemStates((prev) => {
      const existing = prev[itemId] ?? { status: "NO_APLICA" as InspectionItemStatus, comment: null };
      return { ...prev, [itemId]: { ...existing, comment: comment || null } };
    });
  };

  const handleSave = async () => {
    const items: InspectionItemRequest[] = Object.entries(itemStates).map(([id, state]) => ({
      id: Number(id),
      status: state.status,
      comment: state.comment,
    }));
    setSaving(true);
    try {
      await inspectionsApi.saveItems(repairOrderId, inspection.id, { items });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await inspectionsApi.delete(repairOrderId, inspection.id);
    onDeleted();
    setDeleteDialogOpen(false);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{inspection.templateTitle}</Typography>
          <IconButton onClick={() => setDeleteDialogOpen(true)} color="error" title="Eliminar inspección">
            <DeleteIcon />
          </IconButton>
        </Stack>

        {inspection.groups.map((group) => (
          <Box key={group.groupId} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {group.groupTitle}
            </Typography>

            {group.items.map((item) => (
              <Box key={item.id} sx={{ ml: 2, mt: 1 }}>
                <Typography variant="body2">{item.templateItemName}</Typography>

                <RadioGroup
                  row
                  value={itemStates[item.id]?.status ?? "NO_APLICA"}
                  onChange={(e) =>
                    handleStatusChange(item.id, e.target.value as InspectionItemStatus)
                  }
                >
                  <FormControlLabel
                    value="OK"
                    control={
                      <Radio
                        sx={{ color: "success.main", "&.Mui-checked": { color: "success.main" } }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                        <Typography variant="caption">OK</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="REVISAR"
                    control={
                      <Radio
                        sx={{ color: "warning.main", "&.Mui-checked": { color: "warning.main" } }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <WarningIcon sx={{ color: "warning.main", fontSize: 20 }} />
                        <Typography variant="caption">Revisar</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="PROBLEMA"
                    control={
                      <Radio
                        sx={{ color: "error.main", "&.Mui-checked": { color: "error.main" } }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ErrorIcon sx={{ color: "error.main", fontSize: 20 }} />
                        <Typography variant="caption">Problema</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="NO_APLICA"
                    control={
                      <Radio
                        sx={{ color: "grey.500", "&.Mui-checked": { color: "grey.500" } }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <RemoveCircleOutlineIcon sx={{ color: "grey.500", fontSize: 20 }} />
                        <Typography variant="caption">N/A</Typography>
                      </Stack>
                    }
                  />
                </RadioGroup>

                <TextField
                  size="small"
                  placeholder="Comentario (opcional)"
                  value={itemStates[item.id]?.comment ?? ""}
                  onChange={(e) => handleCommentChange(item.id, e.target.value)}
                  fullWidth
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar inspección"}
        </Button>
      </CardActions>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar inspección</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar esta inspección? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
