import { Grid, Typography, Divider, Button } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { AppDialog } from "@/components/AppDialog";

import type { Client } from "@/features/clients/types/client";

interface ClientDetailDialogProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
}

export default function ClientDetailDialog({ open, onClose, client }: ClientDetailDialogProps) {
    if (!client) return null;

    return (
        <AppDialog
            open={open}
            onClose={onClose}
            title="Detalle del Cliente"
            icon={<PersonOutlineIcon sx={{ fontSize: "1.25rem" }} />}
            actions={<Button onClick={onClose} color="inherit">Cerrar</Button>}
        >
            <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                        <Typography variant="body1">{client.id}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                        <Typography variant="body1">{client.firstName} {client.lastName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Tipo</Typography>
                        <Typography variant="body1">{client.clientType}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">DNI</Typography>
                        <Typography variant="body1">{client.dni || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                        <Typography variant="body1">{client.phone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{client.email || "—"}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Dirección</Typography>
                        <Typography variant="body1">{client.address || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Provincia</Typography>
                        <Typography variant="body1">{client.province || "—"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">País</Typography>
                        <Typography variant="body1">{client.country || "—"}</Typography>
                    </Grid>
                </Grid>
        </AppDialog>
    );
}
