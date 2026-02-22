import { useState } from "react";

import {
  Popover,
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import type { BrandResponse } from "@/types/vehicle";

interface VehicleFiltersProps {
  brands: BrandResponse[];
  onApplyFilter: (type: "brand" | "year" | "model" | "inRepair", value: string | number | boolean) => void;
  onClearFilters: () => void;
}

export function VehicleFilters({ brands, onApplyFilter, onClearFilters }: VehicleFiltersProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [yearValue, setYearValue] = useState("");
  const [modelValue, setModelValue] = useState("");
  const [inRepairValue, setInRepairValue] = useState<string>("all");

  const open = Boolean(anchorEl);

  const handleApply = () => {
    if (inRepairValue !== "all") {
      onApplyFilter("inRepair", inRepairValue === "true");
    } else if (selectedBrand) {
      onApplyFilter("brand", selectedBrand.id);
    } else if (yearValue) {
      onApplyFilter("year", parseInt(yearValue, 10));
    } else if (modelValue) {
      onApplyFilter("model", modelValue);
    }
    setAnchorEl(null);
  };

  const handleClear = () => {
    setSelectedBrand(null);
    setYearValue("");
    setModelValue("");
    setInRepairValue("all");
    onClearFilters();
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 500,
          color: "#475569",
          borderColor: "#e2e8f0",
          backgroundColor: "#fff",
          "&:hover": {
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
          },
        }}
      >
        Filtros
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Stack spacing={2} sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="subtitle2">Filtrar por</Typography>
          <Autocomplete
            options={brands}
            getOptionLabel={(option) => option.name}
            value={selectedBrand}
            onChange={(_e, value) => {
              setSelectedBrand(value);
              setYearValue("");
              setModelValue("");
            }}
            renderInput={(params) => <TextField {...params} label="Marca" size="small" />}
          />
          <TextField
            label="Año"
            type="number"
            size="small"
            value={yearValue}
            onChange={(e) => {
              setYearValue(e.target.value);
              setSelectedBrand(null);
              setModelValue("");
            }}
          />
          <TextField
            label="Modelo"
            size="small"
            value={modelValue}
            onChange={(e) => {
              setModelValue(e.target.value);
              setSelectedBrand(null);
              setYearValue("");
              setInRepairValue("all");
            }}
          />
          <FormControl size="small">
            <InputLabel>En reparación</InputLabel>
            <Select
              value={inRepairValue}
              label="En reparación"
              onChange={(e) => {
                setInRepairValue(e.target.value as string);
                setSelectedBrand(null);
                setYearValue("");
                setModelValue("");
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClear}>
              Limpiar
            </Button>
            <Button size="small" variant="contained" onClick={handleApply}>
              Aplicar
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
