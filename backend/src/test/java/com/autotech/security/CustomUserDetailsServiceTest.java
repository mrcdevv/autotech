package com.autotech.security;

import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.permission.model.Permission;
import com.autotech.role.model.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    private static final String EMAIL = "mecanico@autotech.com";

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void givenEmployeeWithRole_whenLoadUser_thenAuthoritiesContainRoleAndPermissionCodes() {
        // Arrange
        Employee employee = buildEmployee(EmployeeStatus.ACTIVO, false,
                buildRole(1L, "MECANICO", "read_client", "read_order"));
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.of(employee));

        // Act
        AuthenticatedEmployee result = customUserDetailsService.loadUserByUsername(EMAIL);

        // Assert
        assertThat(result.getAuthorities()).extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_MECANICO", "read_client", "read_order");
        assertThat(result.isEnabled()).isTrue();
        assertThat(result.isMustChangePassword()).isFalse();
    }

    @Test
    void givenRolesSharingPermissions_whenLoadUser_thenPermissionCodesAreNotDuplicated() {
        // Arrange
        Employee employee = buildEmployee(EmployeeStatus.ACTIVO, true,
                buildRole(1L, "MECANICO", "read_client"),
                buildRole(2L, "RECEPCIONISTA", "read_client", "create_client"));
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.of(employee));

        // Act
        AuthenticatedEmployee result = customUserDetailsService.loadUserByUsername(EMAIL);

        // Assert
        assertThat(result.getAuthorities()).extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_MECANICO", "ROLE_RECEPCIONISTA", "read_client", "create_client");
        assertThat(result.isMustChangePassword()).isTrue();
    }

    @Test
    void givenInactiveEmployee_whenLoadUser_thenUserIsDisabled() {
        // Arrange
        Employee employee = buildEmployee(EmployeeStatus.INACTIVO, false);
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.of(employee));

        // Act
        AuthenticatedEmployee result = customUserDetailsService.loadUserByUsername(EMAIL);

        // Assert
        assertThat(result.isEnabled()).isFalse();
        assertThat(result.getAuthorities()).isEmpty();
    }

    @Test
    void givenUnknownEmail_whenLoadUser_thenThrowUsernameNotFoundException() {
        // Arrange
        when(employeeRepository.findWithRolesAndPermissionsByEmail(EMAIL)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private Employee buildEmployee(EmployeeStatus status, boolean mustChangePassword, Role... roles) {
        return Employee.builder()
                .email(EMAIL)
                .password("encoded")
                .status(status)
                .mustChangePassword(mustChangePassword)
                .roles(Set.of(roles))
                .build();
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
