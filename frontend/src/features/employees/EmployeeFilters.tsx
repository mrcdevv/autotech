import { useState, useEffect } from "react";

import {
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";

import { AppSearchField } from "@/components/AppSearchField";
import { rolesApi } from "@/api/roles";
import type { RoleResponse } from "@/types/role";

interface EmployeeFiltersProps {
  onFilterChange: (filters: {
    dni: string;
    roleId: number | "";
    status: string;
  }) => void;
}

export function EmployeeFilters({ onFilterChange }: EmployeeFiltersProps) {
  const [dni, setDni] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [roles, setRoles] = useState<RoleResponse[]>([]);

  useEffect(() => {
    rolesApi.getAll().then((res) => setRoles(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    onFilterChange({ dni, roleId, status });
  }, [dni, roleId, status, onFilterChange]);

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
      <AppSearchField
        placeholder="Buscar por DNI"
        value={dni}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "" || /^[0-9]{1,8}$/.test(value)) {
            setDni(value);
          }
        }}
        sx={{ width: { xs: "100%", md: 260 }, minWidth: 260 }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Filtrar por cargo</InputLabel>
        <Select
          value={roleId}
          label="Filtrar por cargo"
          onChange={(e) => setRoleId(e.target.value as number | "")}
        >
          <MenuItem value="">Todos</MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {role.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Filtrar por estado</InputLabel>
        <Select
          value={status}
          label="Filtrar por estado"
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ACTIVO">Activo</MenuItem>
          <MenuItem value="INACTIVO">Inactivo</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
