package com.autotech.employee.service;

import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.dto.EmployeeMapper;
import com.autotech.employee.dto.EmployeeRequest;
import com.autotech.employee.dto.EmployeeResponse;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    @Test
    void givenValidId_whenGetById_thenReturnEmployeeResponse() {
        // Arrange
        Employee employee = buildEmployee(1L, EmployeeStatus.ACTIVO);
        EmployeeResponse expected = buildEmployeeResponse(1L, EmployeeStatus.ACTIVO);
        when(employeeRepository.findWithRolesById(1L)).thenReturn(Optional.of(employee));
        when(employeeMapper.toResponse(employee)).thenReturn(expected);

        // Act
        EmployeeResponse result = employeeService.getById(1L);

        // Assert
        assertThat(result).isEqualTo(expected);
    }

    @Test
    void givenNonExistentId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(employeeRepository.findWithRolesById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> employeeService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenExistingEmployee_whenUpdateWithInactivoStatus_thenEmployeeIsDeactivated() {
        // Arrange
        Employee employee = buildEmployee(1L, EmployeeStatus.ACTIVO);
        EmployeeRequest request = new EmployeeRequest(
                "Juan", "Pérez", "12345678", null, "555-1234",
                null, null, null, null, null, 0, null,
                EmployeeStatus.INACTIVO, List.of(1L), null);
        when(employeeRepository.findWithRolesById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.existsByDniAndIdNot("12345678", 1L)).thenReturn(false);
        when(roleRepository.findByIdIn(List.of(1L))).thenReturn(List.of(buildRole(1L)));
        when(employeeRepository.save(employee)).thenReturn(employee);

        // Act
        employeeService.update(1L, request);

        // Assert
        assertThat(employee.getStatus()).isEqualTo(EmployeeStatus.INACTIVO);
        verify(employeeRepository).save(employee);
    }

    private Employee buildEmployee(Long id, EmployeeStatus status) {
        Employee employee = Employee.builder()
                .firstName("Juan")
                .lastName("Pérez")
                .dni("12345678")
                .phone("555-1234")
                .status(status)
                .roles(new HashSet<>())
                .build();
        employee.setId(id);
        return employee;
    }

    private Role buildRole(Long id) {
        Role role = Role.builder().name("MECANICO").build();
        role.setId(id);
        return role;
    }

    private EmployeeResponse buildEmployeeResponse(Long id, EmployeeStatus status) {
        return new EmployeeResponse(id, "Juan", "Pérez", "12345678", null, "555-1234",
                null, null, null, null, null, 0, null, status, List.of(), null, null);
    }
}
