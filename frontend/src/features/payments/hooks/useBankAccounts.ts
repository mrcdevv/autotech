import { useState, useEffect, useCallback } from "react";

import { bankAccountsApi } from "@/api/bankAccounts";

import type { BankAccountResponse, BankResponse } from "@/types/payment";

export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, banksRes] = await Promise.all([
        bankAccountsApi.getAll(),
        bankAccountsApi.getAllBanks(),
      ]);
      setBankAccounts(accountsRes.data.data);
      setBanks(banksRes.data.data);
    } catch {
      setError("Error al cargar las cuentas bancarias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  return {
    bankAccounts,
    banks,
    loading,
    error,
    refetch: fetchBankAccounts,
  };
}
