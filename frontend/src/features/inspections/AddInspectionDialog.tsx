import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";

import { useInspectionTemplates } from "@/features/inspections/useInspectionTemplates";

interface AddInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: number) => void;
}

export function AddInspectionDialog({ open, onClose, onSelect }: AddInspectionDialogProps) {
  const { templates, loading } = useInspectionTemplates();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Inspección</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && templates.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No hay plantillas de inspección disponibles. Cree una desde la configuración.
          </Typography>
        )}
        {!loading && templates.length > 0 && (
          <List>
            {templates.map((template) => (
              <ListItemButton key={template.id} onClick={() => onSelect(template.id)}>
                <ListItemText
                  primary={template.title}
                  secondary={`${template.groups.length} grupo(s)`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
