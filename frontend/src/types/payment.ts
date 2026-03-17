export type PaymentType = "EFECTIVO" | "CUENTA_BANCARIA";

export type AuditAction = "CREATED" | "MODIFIED" | "DELETED";

export interface PaymentRequest {
  paymentDate: string;
  amount: number;
  payerName: string | null;
  paymentType: PaymentType;
  bankAccountId: number | null;
  registeredByEmployeeId: number | null;
}

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  paymentDate: string;
  createdAt: string;
  amount: number;
  payerName: string | null;
  paymentType: PaymentType;
  bankAccountId: number | null;
  bankAccountAlias: string | null;
  bankName: string | null;
  registeredByEmployeeId: number | null;
  registeredByEmployeeFullName: string | null;
}

export interface PaymentSummaryResponse {
  totalServices: number;
  totalProducts: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  totalPaid: number;
  remaining: number;
}

export interface BankAccountRequest {
  bankId: number;
  alias: string;
  cbuCvu: string | null;
}

export interface BankAccountResponse {
  id: number;
  bankId: number;
  bankName: string;
  alias: string;
  cbuCvu: string | null;
  createdAt: string;
}

export interface BankResponse {
  id: number;
  name: string;
}
