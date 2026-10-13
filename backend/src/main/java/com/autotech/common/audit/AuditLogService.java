package com.autotech.common.audit;

import com.autotech.common.audit.dto.AuditEntryResponse;
import com.autotech.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Read side of the audit log: the history of one entity, newest first.
 * The entityType arrives as a raw string so an unknown value produces a clear
 * 400 (Spanish message) instead of a Spring conversion error that would fall
 * through to the generic 500 handler.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    public List<AuditEntryResponse> getHistory(String entityType, Long entityId) {
        AuditEntityType type = parseEntityType(entityType);
        List<AuditLog> rows = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(type, entityId);
        return auditLogMapper.toResponseList(rows);
    }

    private AuditEntityType parseEntityType(String entityType) {
        try {
            return AuditEntityType.valueOf(entityType);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BusinessException("Tipo de entidad no válido: " + entityType
                    + ". Valores permitidos: REPAIR_ORDER, ESTIMATE, INVOICE");
        }
    }
}
