package com.autotech.auth.service;

import com.autotech.auth.dto.CurrentUserMapper;
import com.autotech.auth.dto.CurrentUserResponse;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.employee.model.Employee;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.permission.model.Permission;
import com.autotech.role.model.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String EMAIL = "recepcion@autotech.com";

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Spy
    private CurrentUserMapper currentUserMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void givenEmployeeWithRoles_whenGetCurrentUser_thenReturnSortedRolesAndDistinctPermissions() {
        // Arrange
        Employee employee = Employee.builder()
                .email(EMAIL)
                .firstName("Ana")
                .lastName("Pérez")
                .mustChangePassword(false)
                .roles(Set.of(
                        buildRole(2L, "RECEPCIONISTA", "read_client", "create_client"),
                        buildRole(1L, "MECANICO", "read_client", "read_order")))
                .build();
        employee.setId(7L);
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.of(employee));

        // Act
        CurrentUserResponse result = authService.getCurrentUser(EMAIL);

        // Assert
        assertThat(result.id()).isEqualTo(7L);
        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.mustChangePassword()).isFalse();
        assertThat(result.roles()).containsExactly("MECANICO", "RECEPCIONISTA");
        assertThat(result.permissions()).containsExactly("create_client", "read_client", "read_order");
    }

    @Test
    void givenUnknownEmail_whenGetCurrentUser_thenThrowUsernameNotFoundException() {
        // Arrange
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.getCurrentUser(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private Role buildRole(Long id, String name, String... permissionCodes) {
        Role role = Role.builder().name(name).build();
        role.setId(id);
        long permissionId = id * 100;
        for (String code : permissionCodes) {
            Permission permission = Permission.builder().code(code).build();
            permission.setId(permissionId++);
            role.getPermissions().add(permission);
        }
        return role;
    }
}
