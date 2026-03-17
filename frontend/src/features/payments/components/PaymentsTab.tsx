import { useState } from "react";

import {
  Box,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PrintIcon from "@mui/icons-material/Print";

import { usePayments } from "../hooks/usePayments";
import { usePaymentSummary } from "../hooks/usePaymentSummary";
import { PaymentSummary } from "./PaymentSummary";
import { CashPaymentDialog } from "./CashPaymentDialog";
import { BankPaymentDialog } from "./BankPaymentDialog";
import { PaymentHistoryGrid } from "./PaymentHistoryGrid";

import type { PaymentResponse } from "@/types/payment";

interface PaymentsTabProps {
  invoiceId: number;
  clientFullName: string;
}

export function PaymentsTab({ invoiceId, clientFullName }: PaymentsTabProps) {
  const {
    payments,
    loading,
    error,
    deletePayment,
    refetch,
  } = usePayments(invoiceId);
  const {
    summary,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = usePaymentSummary(invoiceId);

  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<PaymentResponse | null>(null);

  const isFullyPaid = summary?.remaining === 0;

  const handlePaymentCreated = () => {
    refetch();
    refetchSummary();
    setCashDialogOpen(false);
    setBankDialogOpen(false);
  };

  const handlePaymentUpdated = () => {
    refetch();
    refetchSummary();
    setEditingPayment(null);
  };

  const handlePaymentDeleted = async (
    paymentId: number,
    performedBy: number,
  ) => {
    await deletePayment(paymentId, performedBy);
    refetchSummary();
  };

  if (summaryLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <PaymentSummary summary={summary} />

      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <Button
          variant="contained"
          startIcon={<AttachMoneyIcon />}
          onClick={() => setCashDialogOpen(true)}
          disabled={isFullyPaid}
        >
          Agregar pago en efectivo
        </Button>
        <Button
          variant="contained"
          startIcon={<AccountBalanceIcon />}
          onClick={() => setBankDialogOpen(true)}
          disabled={isFullyPaid}
        >
          Agregar pago a cuenta bancaria
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Imprimir factura
        </Button>
      </Stack>

      <PaymentHistoryGrid
        payments={payments}
        loading={loading}
        onEdit={(payment) => setEditingPayment(payment)}
        onDelete={handlePaymentDeleted}
      />

      <CashPaymentDialog
        open={
          cashDialogOpen ||
          editingPayment?.paymentType === "EFECTIVO"
        }
        onClose={() => {
          setCashDialogOpen(false);
          setEditingPayment(null);
        }}
        invoiceId={invoiceId}
        remaining={summary?.remaining ?? 0}
        clientFullName={clientFullName}
        editingPayment={
          editingPayment?.paymentType === "EFECTIVO"
            ? editingPayment
            : null
        }
        onCreated={handlePaymentCreated}
        onUpdated={handlePaymentUpdated}
      />

      <BankPaymentDialog
        open={
          bankDialogOpen ||
          editingPayment?.paymentType === "CUENTA_BANCARIA"
        }
        onClose={() => {
          setBankDialogOpen(false);
          setEditingPayment(null);
        }}
        invoiceId={invoiceId}
        remaining={summary?.remaining ?? 0}
        clientFullName={clientFullName}
        editingPayment={
          editingPayment?.paymentType === "CUENTA_BANCARIA"
            ? editingPayment
            : null
        }
        onCreated={handlePaymentCreated}
        onUpdated={handlePaymentUpdated}
      />
    </Box>
  );
}
