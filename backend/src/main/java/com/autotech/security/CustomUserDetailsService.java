package com.autotech.security;

import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final String ROLE_PREFIX = "ROLE_";

    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public AuthenticatedEmployee loadUserByUsername(String email) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findWithRolesAndPermissionsByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Employee not found with email: " + email));

        boolean enabled = EmployeeStatus.ACTIVO.equals(employee.getStatus());

        return new AuthenticatedEmployee(
                employee.getEmail(),
                employee.getPassword(),
                enabled,
                Boolean.TRUE.equals(employee.getMustChangePassword()),
                buildAuthorities(employee));
    }

    /** Authorities = ROLE_<name> for each role plus every permission code granted by those roles. */
    private Set<GrantedAuthority> buildAuthorities(Employee employee) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        employee.getRoles().forEach(role -> {
            authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + role.getName().toUpperCase()));
            role.getPermissions().forEach(permission ->
                    authorities.add(new SimpleGrantedAuthority(permission.getCode())));
        });
        return authorities;
    }
}
