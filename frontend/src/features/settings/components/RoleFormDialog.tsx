import { useEffect, useState } from "react";

import { Alert, Autocomplete, Button, Stack, TextField } from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

import { AppDialog } from "@/components/AppDialog";
import { permissionsApi } from "@/api/permissions";
import { rolesApi } from "@/api/roles";

import type { PermissionResponse, RoleResponse } from "@/types/role";

interface RoleFormDialogProps {
  open: boolean;
  role: RoleResponse | null;
  onClose: () => void;
  onSave: () => void;
}

export function RoleFormDialog({ open, role, onClose, onSave }: RoleFormDialogProps) {
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionIds, setPermissionIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      permissionsApi.getAll().then((res) => setPermissions(res.data.data));
      if (role) {
        setName(role.name);
        setDescription(role.description ?? "");
        setPermissionIds(role.permissions.map((p) => p.id));
      } else {
        setName("");
        setDescription("");
        setPermissionIds([]);
      }
    }
  }, [open, role]);

  const selectedPermissions = permissions.filter((p) => permissionIds.includes(p.id));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const request = {
        name: name.trim(),
        description: description.trim() || null,
        permissionIds,
      };
      if (role) {
        await rolesApi.update(role.id, request);
      } else {
        await rolesApi.create(request);
      }
      onSave();
    } catch {
      setError("Error al guardar el rol");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={role ? "Editar rol" : "Nuevo rol"}
      icon={<BadgeOutlinedIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 0.5 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText="Opcional"
        />
        <Autocomplete
          multiple
          options={permissions}
          getOptionLabel={(p) => p.description}
          value={selectedPermissions}
          onChange={(_, value) => setPermissionIds(value.map((p) => p.id))}
          renderInput={(params) => <TextField {...params} label="Permisos" helperText="Opcional" />}
        />
      </Stack>
    </AppDialog>
  );
}
