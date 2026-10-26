export type AuditEntityType = "REPAIR_ORDER" | "ESTIMATE" | "DELIVERY_NOTE";

export interface AuditLogRow {
  id: number;
  entityType: AuditEntityType;
  entityId: number;
  action: string;
  /** Raw JSON text as stored by the backend, or null when there is no value. */
  oldValues: string | null;
  newValues: string | null;
  performedByEmployeeId: number | null;
  /** Null when the row was written without a security context. */
  performedByEmployeeName: string | null;
  createdAt: string;
}
