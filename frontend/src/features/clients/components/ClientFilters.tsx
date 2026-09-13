import { useState, useEffect } from "react";

import { AppSearchField } from "@/components/AppSearchField";

interface ClientFiltersProps {
    onSearch: (query: string) => void;
}

export default function ClientFilters({ onSearch }: ClientFiltersProps) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(value);
        }, 300); // 300ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [value, onSearch]);

    return (
        <AppSearchField
            placeholder="DNI, Nombre o Apellido..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}
