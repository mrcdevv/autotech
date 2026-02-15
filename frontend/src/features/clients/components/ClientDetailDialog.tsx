import { Dialog, DialogTitle, DialogContent, Grid, Typography, Divider, Button, DialogActions } from "@mui/material";
import type { Client } from "@/features/clients/types/client";

interface ClientDetailDialogProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
}

export default function ClientDetailDialog({ open, onClose, client }: ClientDetailDialogProps) {
    if (!client) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Detalle del Cliente</DialogTitle>
            <DialogContent dividers>
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
