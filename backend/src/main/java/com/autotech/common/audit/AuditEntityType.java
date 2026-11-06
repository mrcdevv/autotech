package com.autotech.common.audit;

/**
 * Entity types that can appear in the generic audit log.
 * Maps to the {@code audit_log.entity_type} CHECK constraint.
 */
public enum AuditEntityType {
    REPAIR_ORDER,
    ESTIMATE,
    DELIVERY_NOTE
}
