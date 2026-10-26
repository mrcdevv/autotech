import apiClient from "./client";

import type { ApiResponse } from "@/types/api";
import type { AuditEntityType, AuditLogRow } from "@/types/auditLog";

export const auditLogsApi = {
  /** Returns the audit rows for one entity, newest first. */
  getByEntity: (entityType: AuditEntityType, entityId: number) =>
    apiClient.get<ApiResponse<AuditLogRow[]>>("/audit-logs", {
      params: { entityType, entityId },
    }),
};
