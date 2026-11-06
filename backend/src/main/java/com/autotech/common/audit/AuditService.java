package com.autotech.common.audit;

import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Shared audit service. Other modules call {@link #record} to append entries
 * to the generic {@code audit_log} table.
 *
 * Guarantees:
 * - The actor is resolved from the security context (email -> employee), never
 *   from a request field. No authentication or an unresolvable email stores a
 *   null actor.
 * - The audit write never throws: serialization and persistence failures are
 *   logged and swallowed so the business operation is never affected.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;

    public void record(AuditEntityType entityType, Long entityId, AuditAction action,
                       Map<String, Object> oldValues, Map<String, Object> newValues) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .oldValues(serialize(oldValues))
                    .newValues(serialize(newValues))
                    .performedByEmployee(resolveActor())
                    .build();
            auditLogRepository.save(auditLog);
            log.debug("Recorded audit log: entity={}:{}, action={}", entityType, entityId, action);
        } catch (Exception e) {
            log.error("Failed to record audit log: entity={}:{}, action={}", entityType, entityId, action, e);
        }
    }

    private String serialize(Map<String, Object> values) {
        if (values == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            log.error("Failed to serialize audit values", e);
            return "{}";
        }
    }

    private Employee resolveActor() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication instanceof AnonymousAuthenticationToken) {
                return null;
            }
            String email = authentication.getName();
            if (email == null) {
                return null;
            }
            return employeeRepository.findByEmail(email).orElse(null);
        } catch (Exception e) {
            log.error("Failed to resolve audit actor from security context", e);
            return null;
        }
    }
}
