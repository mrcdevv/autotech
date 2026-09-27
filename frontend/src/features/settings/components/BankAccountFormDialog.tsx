import { useState, useEffect } from "react";

import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import { AppDialog } from "@/components/AppDialog";
import { bankAccountsApi } from "@/api/bankAccounts";
import { getBankLogo } from "@/assets/bank-logos";

import type { BankAccountResponse, BankResponse } from "@/types/payment";

interface BankAccountFormDialogProps {
  open: boolean;
  account: BankAccountResponse | null;
  onClose: () => void;
  onSave: () => void;
}

export function BankAccountFormDialog({ open, account, onClose, onSave }: BankAccountFormDialogProps) {
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [bankId, setBankId] = useState<number | null>(null);
  const [alias, setAlias] = useState("");
  const [cbuCvu, setCbuCvu] = useState("");

  useEffect(() => {
    if (open) {
      bankAccountsApi.getAllBanks().then((res) => setBanks(res.data.data));
      if (account) {
        setBankId(account.bankId);
        setAlias(account.alias);
        setCbuCvu(account.cbuCvu ?? "");
      } else {
        setBankId(null);
        setAlias("");
        setCbuCvu("");
      }
    }
  }, [open, account]);

  const selectedBank = banks.find((b) => b.id === bankId) ?? null;
  const selectedBankLogo = selectedBank ? getBankLogo(selectedBank.name) : undefined;

  const handleSave = async () => {
    if (!bankId || !alias.trim()) return;
    const request = { bankId, alias, cbuCvu: cbuCvu || null };
    if (account) {
      await bankAccountsApi.update(account.id, request);
    } else {
      await bankAccountsApi.create(request);
    }
    onSave();
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={account ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
      icon={<AccountBalanceIcon sx={{ fontSize: "1.25rem" }} />}
      actions={
        <>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!bankId || !alias.trim()}>
            Guardar
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Autocomplete
            options={banks}
            getOptionLabel={(b) => b.name}
            value={selectedBank}
            onChange={(_, v) => setBankId(v?.id ?? null)}
            renderOption={(props, option) => {
              const logo = getBankLogo(option.name);
              return (
                <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {logo ? (
                    <Avatar src={logo} variant="rounded" sx={{ width: 28, height: 28 }} />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 28, height: 28 }}><AccountBalanceIcon sx={{ fontSize: 16 }} /></Avatar>
                  )}
                  {option.name}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Banco"
                required
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: selectedBank ? (
                      <>
                        {selectedBankLogo ? (
                          <Avatar
                            src={selectedBankLogo}
                            variant="rounded"
                            sx={{ width: 28, height: 28, mr: 1 }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 28, height: 28, mr: 1 }}>
                            <AccountBalanceIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                        )}
                        {params.InputProps.startAdornment}
                      </>
                    ) : (
                      params.InputProps.startAdornment
                    ),
                  },
                }}
              />
            )}
          />
          <TextField
            label="Alias o nombre de la cuenta"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
          />
          <TextField
            label="CBU o CVU"
            value={cbuCvu}
            onChange={(e) => setCbuCvu(e.target.value)}
            helperText="Opcional"
          />
        </Stack>
    </AppDialog>
  );
}
