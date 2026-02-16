import { useState } from "react";

import {
  Popover,
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import type { BrandResponse } from "@/types/vehicle";

interface VehicleFiltersProps {
  brands: BrandResponse[];
  onApplyFilter: (type: "brand" | "year" | "model", value: string | number) => void;
  onClearFilters: () => void;
}

export function VehicleFilters({ brands, onApplyFilter, onClearFilters }: VehicleFiltersProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [yearValue, setYearValue] = useState("");
  const [modelValue, setModelValue] = useState("");

  const open = Boolean(anchorEl);

  const handleApply = () => {
    if (selectedBrand) {
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
    onClearFilters();
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
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
            }}
          />
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
