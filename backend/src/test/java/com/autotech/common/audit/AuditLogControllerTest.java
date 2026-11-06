package com.autotech.common.audit;

import com.autotech.common.audit.dto.AuditEntryResponse;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Standalone MockMvc test (no Spring context, no @WebMvcTest slice):
 * the repo has @WebMvcTest slices that are red on the base commit, so this
 * controller is covered here instead of a slice.
 */
class AuditLogControllerTest {

    private AuditLogService auditLogService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        auditLogService = Mockito.mock(AuditLogService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuditLogController(auditLogService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void givenRowsForEntity_whenGetAuditHistory_thenReturnRowsNewestFirst() throws Exception {
        // Arrange
        AuditEntryResponse newer = new AuditEntryResponse(2L, AuditEntityType.ESTIMATE, 5L, AuditAction.MODIFIED,
                "{\"approvedTotal\":100.00}", "{\"approvedTotal\":150.00}",
                7L, "Carlos Rojas", LocalDateTime.of(2025, 5, 2, 10, 30));
        AuditEntryResponse older = new AuditEntryResponse(1L, AuditEntityType.ESTIMATE, 5L, AuditAction.CREATED,
                null, "{\"status\":\"BORRADOR\"}",
                7L, "Carlos Rojas", LocalDateTime.of(2025, 5, 1, 9, 0));
        when(auditLogService.getHistory("ESTIMATE", 5L)).thenReturn(List.of(newer, older));

        // Act & Assert
        mockMvc.perform(get("/api/audit-logs")
                        .param("entityType", "ESTIMATE")
                        .param("entityId", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].id").value(2))
                .andExpect(jsonPath("$.data[0].action").value("MODIFIED"))
                .andExpect(jsonPath("$.data[0].oldValues").value("{\"approvedTotal\":100.00}"))
                .andExpect(jsonPath("$.data[0].newValues").value("{\"approvedTotal\":150.00}"))
                .andExpect(jsonPath("$.data[0].performedByEmployeeId").value(7))
                .andExpect(jsonPath("$.data[0].performedByEmployeeName").value("Carlos Rojas"))
                .andExpect(jsonPath("$.data[1].id").value(1))
                .andExpect(jsonPath("$.data[1].action").value("CREATED"));
    }

    @Test
    void givenNullActor_whenGetAuditHistory_thenActorFieldsAreNullInResponse() throws Exception {
        // Arrange
        AuditEntryResponse withoutActor = new AuditEntryResponse(1L, AuditEntityType.REPAIR_ORDER, 3L,
                AuditAction.MODIFIED, "{\"status\":\"APROBADO\"}", "{\"status\":\"REABIERTO\"}",
                null, null, LocalDateTime.of(2025, 5, 1, 9, 0));
        when(auditLogService.getHistory("REPAIR_ORDER", 3L)).thenReturn(List.of(withoutActor));

        // Act & Assert
        mockMvc.perform(get("/api/audit-logs")
                        .param("entityType", "REPAIR_ORDER")
                        .param("entityId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].performedByEmployeeId").value(nullValue()))
                .andExpect(jsonPath("$.data[0].performedByEmployeeName").value(nullValue()));
    }

    @Test
    void givenUnknownEntityType_whenGetAuditHistory_thenReturn400WithSpanishMessage() throws Exception {
        // Arrange
        when(auditLogService.getHistory("WIDGET", 5L))
                .thenThrow(new BusinessException("Tipo de entidad no válido: WIDGET"));

        // Act & Assert
        mockMvc.perform(get("/api/audit-logs")
                        .param("entityType", "WIDGET")
                        .param("entityId", "5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tipo de entidad no válido: WIDGET"));
    }
}
