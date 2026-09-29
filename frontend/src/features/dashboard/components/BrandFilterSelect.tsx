import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import type { BrandResponse } from "@/types/vehicle";

interface BrandFilterSelectProps {
  brands: BrandResponse[];
  brandId: number | null;
  onChange: (brandId: number | null) => void;
}

export function BrandFilterSelect({ brands, brandId, onChange }: BrandFilterSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="report-brand-filter-label">Marca</InputLabel>
      <Select
        labelId="report-brand-filter-label"
        label="Marca"
        value={brandId === null ? "all" : String(brandId)}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === "all" ? null : Number(value));
        }}
      >
        <MenuItem value="all">Todas</MenuItem>
        {brands.map((brand) => (
          <MenuItem key={brand.id} value={String(brand.id)}>
            {brand.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
