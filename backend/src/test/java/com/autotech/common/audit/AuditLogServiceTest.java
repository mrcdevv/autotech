package com.autotech.common.audit;

import com.autotech.common.audit.dto.AuditEntryResponse;
import com.autotech.common.exception.BusinessException;
import com.autotech.employee.model.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository, new AuditLogMapper());
    }

    @Test
    void givenRowsForEntity_whenGetHistory_thenReturnRowsNewestFirstWithBeforeAfterValues() {
        // Arrange
        Employee actor = Employee.builder().firstName("Carlos").lastName("Rojas").build();
        actor.setId(7L);
        AuditLog newer = buildAuditLog(2L, AuditAction.MODIFIED,
                "{\"approvedTotal\":100.00}", "{\"approvedTotal\":150.00}", actor,
                LocalDateTime.of(2025, 5, 2, 10, 30));
        AuditLog older = buildAuditLog(1L, AuditAction.CREATED,
                null, "{\"status\":\"BORRADOR\"}", actor,
                LocalDateTime.of(2025, 5, 1, 9, 0));
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType.ESTIMATE, 5L))
                .thenReturn(List.of(newer, older));

        // Act
        List<AuditEntryResponse> result = auditLogService.getHistory("ESTIMATE", 5L);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(2L);
        assertThat(result.get(0).action()).isEqualTo(AuditAction.MODIFIED);
        assertThat(result.get(0).oldValues()).isEqualTo("{\"approvedTotal\":100.00}");
        assertThat(result.get(0).newValues()).isEqualTo("{\"approvedTotal\":150.00}");
        assertThat(result.get(1).id()).isEqualTo(1L);
        assertThat(result.get(1).oldValues()).isNull();
        assertThat(result.get(1).newValues()).isEqualTo("{\"status\":\"BORRADOR\"}");
    }

    @Test
    void givenRowsOnlyForRequestedEntity_whenGetHistory_thenRepositoryReceivesExactEntityTypeAndId() {
        // Arrange
        AuditLog estimateRow = buildAuditLog(1L, AuditAction.MODIFIED, "{}", "{}", null,
                LocalDateTime.of(2025, 5, 1, 9, 0));
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType.ESTIMATE, 5L))
                .thenReturn(List.of(estimateRow));

        // Act
        List<AuditEntryResponse> estimateResult = auditLogService.getHistory("ESTIMATE", 5L);

        // Assert
        assertThat(estimateResult).hasSize(1);
        assertThat(estimateResult.get(0).entityType()).isEqualTo(AuditEntityType.ESTIMATE);
        assertThat(estimateResult.get(0).entityId()).isEqualTo(5L);
        verify(auditLogRepository).findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType.ESTIMATE, 5L);
    }

    @Test
    void givenNullActor_whenGetHistory_thenResponseToleratesMissingActor() {
        // Arrange
        AuditLog rowWithoutActor = buildAuditLog(1L, AuditAction.MODIFIED,
                "{\"status\":\"APROBADO\"}", "{\"status\":\"REABIERTO\"}", null,
                LocalDateTime.of(2025, 5, 1, 9, 0));
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType.REPAIR_ORDER, 3L))
                .thenReturn(List.of(rowWithoutActor));

        // Act
        List<AuditEntryResponse> result = auditLogService.getHistory("REPAIR_ORDER", 3L);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).performedByEmployeeId()).isNull();
        assertThat(result.get(0).performedByEmployeeName()).isNull();
    }

    @Test
    void givenUnknownEntityType_whenGetHistory_thenThrowBusinessExceptionWithSpanishMessage() {
        // Act & Assert
        assertThatThrownBy(() -> auditLogService.getHistory("WIDGET", 5L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tipo de entidad no válido")
                .hasMessageContaining("WIDGET");
        verifyNoInteractions(auditLogRepository);
    }

    private AuditLog buildAuditLog(Long id, AuditAction action, String oldValues, String newValues,
                                   Employee actor, LocalDateTime createdAt) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(AuditEntityType.ESTIMATE)
                .entityId(5L)
                .action(action)
                .oldValues(oldValues)
                .newValues(newValues)
                .performedByEmployee(actor)
                .createdAt(createdAt)
                .build();
        auditLog.setId(id);
        return auditLog;
    }
}
