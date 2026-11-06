package com.autotech.common.audit.dto;

import com.autotech.common.audit.AuditAction;
import com.autotech.common.audit.AuditEntityType;

import java.time.LocalDateTime;

/**
 * One readable history line for the UI. Deliberately small:
 * - {@code oldValues}/{@code newValues} are the raw JSON text as stored in the
 *   {@code audit_log} jsonb columns; the caller parses what it needs.
 * - {@code performedByEmployeeId}/{@code performedByEmployeeName} are null when
 *   no actor was recorded (rows written without a security context); deleted
 *   actors are impossible by design.
 */
public record AuditEntryResponse(
        Long id,
        AuditEntityType entityType,
        Long entityId,
        AuditAction action,
        String oldValues,
        String newValues,
        Long performedByEmployeeId,
        String performedByEmployeeName,
        LocalDateTime createdAt
) {}
