import { useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Autocomplete,
} from "@mui/material";

import { usePayments } from "../hooks/usePayments";
import { useBankAccounts } from "../hooks/useBankAccounts";

import type { PaymentRequest, PaymentResponse } from "@/types/payment";

interface BankPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  remaining: number;
  clientFullName: string;
  editingPayment: PaymentResponse | null;
  onCreated: () => void;
  onUpdated: () => void;
}

export function BankPaymentDialog({
  open,
  onClose,
  invoiceId,
  remaining,
  clientFullName,
  editingPayment,
  onCreated,
  onUpdated,
}: BankPaymentDialogProps) {
  const isEditing = editingPayment !== null;
  const { createPayment, updatePayment } = usePayments(invoiceId);
  const { bankAccounts, loading: bankAccountsLoading } = useBankAccounts();

  const getToday = () => new Date().toISOString().slice(0, 10);

  const [paymentDate, setPaymentDate] = useState<string>(getToday());
  const [amount, setAmount] = useState<number>(0);
  const [payerName, setPayerName] = useState<string>("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<
    number | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setPaymentDate(editingPayment?.paymentDate ?? getToday());
      setAmount(editingPayment?.amount ?? 0);
      setPayerName(editingPayment?.payerName ?? "");
      setSelectedBankAccountId(editingPayment?.bankAccountId ?? null);
      setConfirmOpen(false);
    }
  }, [open, editingPayment]);

  const handleRemainingClick = () => {
    const maxAmount = isEditing
      ? remaining + (editingPayment?.amount ?? 0)
      : remaining;
    setAmount(maxAmount);
  };

  const handleSubmit = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const request: PaymentRequest = {
      paymentDate,
      amount,
      payerName: payerName || null,
      paymentType: "CUENTA_BANCARIA",
      bankAccountId: selectedBankAccountId,
      registeredByEmployeeId: null,
    };

    if (isEditing) {
      await updatePayment(editingPayment.id, request);
      onUpdated();
    } else {
      await createPayment(request);
      onCreated();
    }
    setConfirmOpen(false);
    onClose();
  };

  const selectedAccount =
    bankAccounts.find((a) => a.id === selectedBankAccountId) ?? null;

  const displayRemaining = isEditing
    ? remaining + (editingPayment?.amount ?? 0)
    : remaining;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing
          ? "Modificar pago a cuenta bancaria"
          : "Agregar pago a cuenta bancaria"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            type="date"
            label="Fecha de pago"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Restante por pagar"
            value={`$${displayRemaining.toFixed(2)}`}
            slotProps={{ input: { readOnly: true } }}
            onClick={handleRemainingClick}
            sx={{ cursor: "pointer" }}
            fullWidth
          />
          <TextField
            type="number"
            label="Monto a pagar"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            slotProps={{
              htmlInput: { min: 0.01, max: displayRemaining, step: 0.01 },
            }}
            fullWidth
          />
          <TextField
            label="Nombre de la persona que realizó el pago"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder={clientFullName}
            fullWidth
          />
          <Autocomplete
            options={bankAccounts}
            getOptionLabel={(option) =>
              `${option.bankName} - ${option.alias}`
            }
            value={selectedAccount}
            onChange={(_, value) =>
              setSelectedBankAccountId(value?.id ?? null)
            }
            loading={bankAccountsLoading}
            renderInput={(params) => (
              <TextField {...params} label="Cuenta bancaria" required />
            )}
          />
        </Box>

        {confirmOpen && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ¿Está seguro que desea{" "}
            {isEditing ? "modificar" : "registrar"} este pago?
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </Button>
            </Box>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={amount <= 0 || selectedBankAccountId === null}
        >
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
