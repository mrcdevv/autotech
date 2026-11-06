package com.autotech.common.audit;

import com.autotech.common.audit.dto.AuditEntryResponse;
import com.autotech.employee.model.Employee;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Manual mapper (no MapStruct): entity -> readable history line.
 */
@Component
public class AuditLogMapper {

    public AuditEntryResponse toResponse(AuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }
        Employee actor = auditLog.getPerformedByEmployee();
        return new AuditEntryResponse(
                auditLog.getId(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getAction(),
                auditLog.getOldValues(),
                auditLog.getNewValues(),
                actor != null ? actor.getId() : null,
                actor != null ? formatName(actor) : null,
                auditLog.getCreatedAt());
    }

    public List<AuditEntryResponse> toResponseList(List<AuditLog> auditLogs) {
        if (auditLogs == null) {
            return null;
        }
        return auditLogs.stream().map(this::toResponse).toList();
    }

    private String formatName(Employee actor) {
        String firstName = actor.getFirstName() == null ? "" : actor.getFirstName();
        String lastName = actor.getLastName() == null ? "" : actor.getLastName();
        return (firstName + " " + lastName).trim();
    }
}
