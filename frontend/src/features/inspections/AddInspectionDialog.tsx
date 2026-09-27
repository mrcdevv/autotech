import {
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import { AppDialog } from "@/components/AppDialog";
import { useInspectionTemplates } from "@/features/inspections/useInspectionTemplates";

interface AddInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: number) => void;
}

export function AddInspectionDialog({ open, onClose, onSelect }: AddInspectionDialogProps) {
  const { templates, loading } = useInspectionTemplates();

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Agregar Inspección"
      icon={<FactCheckOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
      actions={<Button onClick={onClose} color="inherit">Cancelar</Button>}
    >
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
                secondary={`${template.groups.length} categoría${template.groups.length !== 1 ? "s" : ""}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </AppDialog>
  );
}
