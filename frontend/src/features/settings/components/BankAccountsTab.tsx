import { useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import { bankAccountsApi } from "@/api/bankAccounts";
import { useBankAccounts } from "@/features/payments/hooks/useBankAccounts";
import { BankAccountFormDialog } from "@/features/settings/components/BankAccountFormDialog";
import { getBankLogo } from "@/assets/bank-logos";

import type { BankAccountResponse } from "@/types/payment";
import type { ApiResponse } from "@/types/api";

export function BankAccountsTab() {
  const { bankAccounts, loading, refetch } = useBankAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const openCreateDialog = () => {
    setSelectedAccount(null);
    setDialogOpen(true);
  };

  const openEditDialog = (account: BankAccountResponse) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    showSnackbar(selectedAccount ? "Cuenta bancaria actualizada" : "Cuenta bancaria creada", "success");
    refetch();
  };

  const handleDelete = async (id: number) => {
    try {
      await bankAccountsApi.delete(id);
      showSnackbar("Cuenta bancaria eliminada", "success");
      refetch();
    } catch (err) {
      const error = err as { response?: { data?: ApiResponse<unknown> } };
      const message = error.response?.data?.message ?? "Error al eliminar la cuenta bancaria";
      showSnackbar(message, "error");
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Cuentas bancarias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Nueva cuenta bancaria
        </Button>
      </Stack>

      {loading && <CircularProgress />}

      <List>
        {bankAccounts.map((account) => (
          <ListItem
            key={account.id}
            secondaryAction={
              <>
                <IconButton onClick={() => openEditDialog(account)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(account.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemAvatar>
              {getBankLogo(account.bankName) ? (
                <Avatar src={getBankLogo(account.bankName)} variant="rounded" />
              ) : (
                <Avatar variant="rounded"><AccountBalanceIcon /></Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={account.alias}
              secondary={`${account.bankName}${account.cbuCvu ? ` — ${account.cbuCvu}` : ""}`}
            />
          </ListItem>
        ))}
      </List>

      {!loading && bankAccounts.length === 0 && (
        <Typography color="text.secondary">No hay cuentas bancarias registradas</Typography>
      )}

      <BankAccountFormDialog
        open={dialogOpen}
        account={selectedAccount}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
