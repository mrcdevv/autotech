import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { BankAccountsTab } from "./BankAccountsTab";

import type { BankAccountResponse } from "@/types/payment";

const mockAccounts: BankAccountResponse[] = [
  {
    id: 1,
    bankId: 10,
    bankName: "Banco Nacion",
    alias: "Cuenta principal",
    cbuCvu: "1234567890",
    createdAt: "2025-01-01T00:00:00",
  },
];

const mockRefetch = vi.fn();
const mockDeleteAccount = vi.fn();

vi.mock("@/features/payments/hooks/useBankAccounts", () => ({
  useBankAccounts: () => ({
    bankAccounts: mockAccounts,
    banks: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@/api/bankAccounts", () => ({
  bankAccountsApi: {
    getAll: vi.fn(),
    getAllBanks: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: (...args: unknown[]) => mockDeleteAccount(...args),
  },
}));

vi.mock("@/features/settings/components/BankAccountFormDialog", () => ({
  BankAccountFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="bank-account-dialog">Dialog</div> : null,
}));

describe("BankAccountsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteAccount.mockResolvedValue({ data: { data: null } });
  });

  it("given accounts exist, when rendered, then shows account list", () => {
    render(<BankAccountsTab />);

    expect(screen.getByText("Cuenta principal")).toBeInTheDocument();
    expect(screen.getByText("Banco Nacion — 1234567890")).toBeInTheDocument();
  });

  it("given new button, when clicked, then opens dialog", async () => {
    const user = userEvent.setup();
    render(<BankAccountsTab />);

    await user.click(screen.getByText("Nueva cuenta bancaria"));

    expect(screen.getByTestId("bank-account-dialog")).toBeInTheDocument();
  });

  it("given delete button, when clicked, then calls delete API", async () => {
    const user = userEvent.setup();
    render(<BankAccountsTab />);

    const deleteBtn = screen.getByTestId("DeleteIcon");
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith(1);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
