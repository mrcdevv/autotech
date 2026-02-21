import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    MenuItem, Grid, Alert, FormControl, InputLabel, Select, CircularProgress
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Controller } from "react-hook-form";
import { useClientForm } from "../hooks/useClientForm";
import type { Client, ClientType } from "@/features/clients/types/client";

interface ClientFormProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
    onSuccess: (client: Client) => void;
}

export default function ClientForm({ open, onClose, client, onSuccess }: ClientFormProps) {
    const { form, onSubmit, checkDniExists } = useClientForm({ client });
    const { control, handleSubmit, formState: { errors }, setValue, setError } = form;
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            form.reset({
                firstName: client?.firstName ?? "",
                lastName: client?.lastName ?? "",
                dni: client?.dni ?? "",
                commercialName: client?.commercialName ?? "",
                email: client?.email ?? "",
                phone: client?.phone ?? "",
                address: client?.address ?? "",
                province: client?.province ?? "",
                country: client?.country ?? "",
                clientType: client?.clientType ?? "PERSONAL",
                entryDate: client?.entryDate ?? new Date().toISOString().split("T")[0],
            });
            setApiError(null);
        }
    }, [client, open, form.reset]);

    const handleFormSubmit = async (data: any) => {
        setLoading(true);
        setApiError(null);

        if (!client && data.dni) {
            const dniExists = await checkDniExists(data.dni);
            if (dniExists) {
                setError("dni", { type: "manual", message: "El DNI ya se encuentra registrado." });
                setLoading(false);
                return;
            }
        }

        try {
            const savedClient = await onSubmit(data);
            onSuccess(savedClient);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || "Error al guardar el cliente.";
            setApiError(message);
        } finally {
            setLoading(false);
        }
    };

    const clientType = form.watch("clientType");
    const isMetadataRequired = clientType !== "TEMPORAL";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{client ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent dividers>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                    {errors.dni && errors.dni.message?.startsWith("DNI") && <Alert severity="error" sx={{ mb: 2 }}>{errors.dni.message}</Alert>}

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Cliente</InputLabel>
                                    <Controller
                                        name="clientType"
                                        control={control}
                                        render={({ field }) => (
                                            <Select {...field} label="Tipo de Cliente" onChange={(e) => setValue("clientType", e.target.value as ClientType, { shouldValidate: true })}>
                                                <MenuItem value="PERSONAL">PERSONAL</MenuItem>
                                                <MenuItem value="EMPRESA">EMPRESA</MenuItem>
                                                <MenuItem value="TEMPORAL">TEMPORAL</MenuItem>
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="firstName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Nombre"
                                            fullWidth
                                            required
                                            error={!!errors.firstName}
                                            helperText={errors.firstName?.message}
                                            onKeyDown={(e) => {
                                                if (e.key.match(/[0-9]/)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="lastName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Apellido"
                                            fullWidth
                                            required
                                            error={!!errors.lastName}
                                            helperText={errors.lastName?.message}
                                            onKeyDown={(e) => {
                                                if (e.key.match(/[0-9]/)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Teléfono"
                                            fullWidth
                                            required
                                            error={!!errors.phone}
                                            helperText={errors.phone?.message}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {isMetadataRequired && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="dni"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="DNI / Documento"
                                                    fullWidth
                                                    required
                                                    error={!!errors.dni}
                                                    helperText={errors.dni?.message}
                                                    onKeyDown={(e) => {
                                                        if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    inputProps={{ maxLength: 8 }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Email" fullWidth type="email" error={!!errors.email} helperText={errors.email?.message} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="commercialName"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Nombre Comercial" fullWidth error={!!errors.commercialName} helperText={errors.commercialName?.message} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="address"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Dirección" fullWidth required error={!!errors.address} helperText={errors.address?.message} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="province"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Provincia" fullWidth required error={!!errors.province} helperText={errors.province?.message} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="country"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="País" fullWidth required error={!!errors.country} helperText={errors.country?.message} />
                                            )}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="entryDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            label="Fecha de Entrada"
                                            value={dayjs(field.value)}
                                            onChange={(newValue) => field.onChange(newValue?.format("YYYY-MM-DD"))}
                                            slotProps={{ textField: { fullWidth: true, error: !!errors.entryDate, helperText: errors.entryDate?.message } }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}