import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { AppDialog } from "@/components/AppDialog";
import { ConfigCard } from "@/features/settings/components/ConfigCard";
import { rolesApi } from "@/api/roles";
import { RoleFormDialog } from "@/features/settings/components/RoleFormDialog";

import type { ApiResponse } from "@/types/api";
import type { RoleResponse } from "@/types/role";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export function RolesSettings() {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.getAll();
      setRoles(res.data.data);
    } catch {
      setError("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const openCreateDialog = () => {
    setSelectedRole(null);
    setFormOpen(true);
  };

  const openEditDialog = (role: RoleResponse) => {
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleFormSave = () => {
    setFormOpen(false);
    showSnackbar(selectedRole ? "Rol actualizado" : "Rol creado", "success");
    loadRoles();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await rolesApi.delete(deleteTarget.id);
      showSnackbar("Rol eliminado", "success");
      setDeleteTarget(null);
      loadRoles();
    } catch (err) {
      const error = err as { response?: { data?: ApiResponse<unknown> } };
      showSnackbar(error.response?.data?.message ?? "Error al eliminar el rol", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfigCard
      title="Roles y permisos"
      icon={<BadgeOutlinedIcon />}
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Agregar rol
        </Button>
      }
    >
      {loading && <CircularProgress />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && roles.length === 0 && (
        <Typography color="text.secondary">No hay roles registrados</Typography>
      )}

      {!loading && !error && roles.length > 0 && (
        <List>
          {roles.map((role) => (
            <ListItem
              key={role.id}
              secondaryAction={
                <>
                  <IconButton aria-label="Editar rol" onClick={() => openEditDialog(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="Eliminar rol" color="error" onClick={() => setDeleteTarget(role)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={role.name}
                secondary={`${role.description ?? "Sin descripción"} — ${role.permissions.length} permisos`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <RoleFormDialog
        open={formOpen}
        role={selectedRole}
        onClose={() => setFormOpen(false)}
        onSave={handleFormSave}
      />

      <AppDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar rol"
        icon={<DeleteIcon sx={{ fontSize: "1.25rem" }} />}
        actions={
          <>
            <Button color="inherit" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <Typography>
          ¿Estás seguro de que querés eliminar el rol “{deleteTarget?.name}”? Esta acción no se puede deshacer.
        </Typography>
      </AppDialog>

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
    </ConfigCard>
  );
}
