import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    MenuItem, Grid, Alert, FormControl, InputLabel, Select, CircularProgress
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { clientsApi } from "@/api/clients";
import type { Client, ClientRequest, ClientType } from "@/features/clients/types/client";

interface ClientFormProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
    onSuccess: () => void;
    onClientCreated?: (client: Client) => void;
}

const initialFormState: ClientRequest = {
    firstName: "",
    lastName: "",
    dni: "",
    commercialName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    country: "",
    clientType: "PERSONAL",
    entryDate: dayjs().format("YYYY-MM-DD"),
};

export default function ClientForm({ open, onClose, client, onSuccess, onClientCreated }: ClientFormProps) {
    const [formData, setFormData] = useState<ClientRequest>(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (client) {
            setFormData({
                firstName: client.firstName,
                lastName: client.lastName,
                dni: client.dni || "",
                commercialName: client.commercialName || "",
                email: client.email || "",
                phone: client.phone,
                address: client.address || "",
                province: client.province || "",
                country: client.country || "",
                clientType: client.clientType,
                entryDate: client.entryDate || dayjs().format("YYYY-MM-DD"),
            });
        } else {
            setFormData(initialFormState);
        }
        setError(null);
    }, [client, open]);

    const handleChange = (field: keyof ClientRequest, value: unknown) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isMetadataRequired = formData.clientType !== "TEMPORAL";

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        // Basic frontend validation
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            setError("Nombre, Apellido y Teléfono son obligatorios.");
            setLoading(false);
            return;
        }
        if (isMetadataRequired && (!formData.dni || !formData.address || !formData.province || !formData.country)) {
            setError("Para clientes PERSONAL o EMPRESA, debe completar DNI, Dirección, Provincia y País.");
            setLoading(false);
            return;
        }

        try {
            if (client) {
                await clientsApi.update(client.id, formData);
            } else {
                const res = await clientsApi.create(formData);
                if (onClientCreated) {
                    onClientCreated(res.data.data);
                }
            }
            onSuccess();
        } catch (err: any) {
            // API error handling
            const message = err.response?.data?.message || err.message || "Error al guardar el cliente.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{client ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Grid container spacing={2}>
                        {/* Type Selector */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Cliente</InputLabel>
                                <Select
                                    value={formData.clientType}
                                    label="Tipo de Cliente"
                                    onChange={(e) => handleChange("clientType", e.target.value as ClientType)}
                                >
                                    <MenuItem value="PERSONAL">PERSONAL</MenuItem>
                                    <MenuItem value="EMPRESA">EMPRESA</MenuItem>
                                    <MenuItem value="TEMPORAL">TEMPORAL</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Basic Info (Always visible) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nombre" fullWidth required
                                value={formData.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Apellido" fullWidth required
                                value={formData.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Teléfono" fullWidth required
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                        </Grid>

                        {/* Extended Info (Visible for PERSONAL/EMPRESA) */}
                        {isMetadataRequired && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="DNI / Documento" fullWidth required
                                        value={formData.dni}
                                        onChange={(e) => handleChange("dni", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Email" fullWidth type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Nombre Comercial" fullWidth
                                        value={formData.commercialName}
                                        onChange={(e) => handleChange("commercialName", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Dirección" fullWidth required
                                        value={formData.address}
                                        onChange={(e) => handleChange("address", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Provincia" fullWidth required
                                        value={formData.province}
                                        onChange={(e) => handleChange("province", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="País" fullWidth required
                                        value={formData.country}
                                        onChange={(e) => handleChange("country", e.target.value)}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Entry Date */}
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Fecha de Entrada"
                                value={dayjs(formData.entryDate)}
                                onChange={(newValue) => handleChange("entryDate", newValue?.format("YYYY-MM-DD"))}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Guardar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
