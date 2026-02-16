import { useState, useEffect } from "react";
import { TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

interface ClientFiltersProps {
    onSearch: (query: string) => void;
}

export default function ClientFilters({ onSearch }: ClientFiltersProps) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(value);
        }, 300);

        return () => clearTimeout(handler);
    }, [value, onSearch]);

    return (
        <TextField
            label="Buscar cliente"
            placeholder="DNI, Nombre o Apellido..."
            variant="outlined"
            size="small"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
            sx={{ width: 300 }}
        />
    );
}
