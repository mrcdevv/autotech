package com.autotech.common.audit;

import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(auditLogRepository, employeeRepository, new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void givenAuthenticatedEmployee_whenRecord_thenStoresEmployeeResolvedFromSecurityContext() {
        // Arrange
        Employee actor = buildEmployee(7L);
        when(employeeRepository.findByEmail("carlos@taller.com")).thenReturn(Optional.of(actor));
        setAuthentication("carlos@taller.com");

        // Act
        auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("status", "REPARACION"), Map.of("status", "ENTREGADO"));

        // Assert
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getPerformedByEmployee()).isNotNull();
        assertThat(saved.getPerformedByEmployee().getId()).isEqualTo(7L);
        assertThat(saved.getEntityType()).isEqualTo(AuditEntityType.REPAIR_ORDER);
        assertThat(saved.getEntityId()).isEqualTo(1L);
        assertThat(saved.getAction()).isEqualTo(AuditAction.MODIFIED);
        assertThat(saved.getOldValues()).contains("REPARACION");
        assertThat(saved.getNewValues()).contains("ENTREGADO");
        // The actor is resolved only by email from the security context; no id-based lookup exists
        verify(employeeRepository, never()).findById(any());
    }

    @Test
    void givenNoSecurityContext_whenRecord_thenStoresNullActorWithoutThrowing() {
        // Arrange
        SecurityContextHolder.clearContext();

        // Act & Assert
        assertThatCode(() -> auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("status", "REPARACION"), Map.of("status", "ENTREGADO")))
                .doesNotThrowAnyException();

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPerformedByEmployee()).isNull();
    }

    @Test
    void givenAnonymousAuthentication_whenRecord_thenStoresNullActorWithoutThrowing() {
        // Arrange
        Authentication anonymous = new AnonymousAuthenticationToken("key", "anonymousUser",
                List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        SecurityContextHolder.getContext().setAuthentication(anonymous);

        // Act & Assert
        assertThatCode(() -> auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("status", "REPARACION"), Map.of("status", "ENTREGADO")))
                .doesNotThrowAnyException();

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPerformedByEmployee()).isNull();
    }

    @Test
    void givenUnknownEmail_whenRecord_thenStoresNullActorWithoutThrowing() {
        // Arrange
        when(employeeRepository.findByEmail("ghost@taller.com")).thenReturn(Optional.empty());
        setAuthentication("ghost@taller.com");

        // Act & Assert
        assertThatCode(() -> auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("status", "REPARACION"), Map.of("status", "ENTREGADO")))
                .doesNotThrowAnyException();

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getPerformedByEmployee()).isNull();
    }

    @Test
    void givenUnserializableValue_whenRecord_thenSavesEmptyJsonWithoutThrowing() {
        // Arrange
        setAuthentication("carlos@taller.com");
        when(employeeRepository.findByEmail("carlos@taller.com")).thenReturn(Optional.of(buildEmployee(7L)));

        // Act & Assert
        assertThatCode(() -> auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("bad", new Object()), Map.of("status", "ENTREGADO")))
                .doesNotThrowAnyException();

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getOldValues()).isEqualTo("{}");
        assertThat(captor.getValue().getNewValues()).contains("ENTREGADO");
    }

    @Test
    void givenRepositoryFailure_whenRecord_thenDoesNotThrow() {
        // Arrange
        setAuthentication("carlos@taller.com");
        when(employeeRepository.findByEmail("carlos@taller.com")).thenReturn(Optional.of(buildEmployee(7L)));
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("db down"));

        // Act & Assert
        assertThatCode(() -> auditService.record(AuditEntityType.REPAIR_ORDER, 1L, AuditAction.MODIFIED,
                Map.of("status", "REPARACION"), Map.of("status", "ENTREGADO")))
                .doesNotThrowAnyException();
    }

    // --- Helpers ---

    private void setAuthentication(String email) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private Employee buildEmployee(Long id) {
        Employee employee = Employee.builder()
                .firstName("Carlos")
                .lastName("Lopez")
                .dni("99887766")
                .phone("5551234")
                .build();
        employee.setId(id);
        return employee;
    }
}
