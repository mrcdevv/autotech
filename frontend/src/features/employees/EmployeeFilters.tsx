import { useState, useEffect } from "react";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        size="small"
        placeholder="Buscar por DNI"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Filtrar por Cargo</InputLabel>
        <Select
          value={roleId}
          label="Filtrar por Cargo"
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
        <InputLabel>Filtrar por Estado</InputLabel>
        <Select
          value={status}
          label="Filtrar por Estado"
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
