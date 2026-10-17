package com.autotech.auth.dto;

import com.autotech.employee.model.Employee;
import com.autotech.permission.model.Permission;
import com.autotech.role.model.Role;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CurrentUserMapper {

    public CurrentUserResponse toResponse(Employee employee) {
        if (employee == null) return null;
        List<String> roles = employee.getRoles().stream()
                .map(Role::getName)
                .sorted()
                .toList();
        List<String> permissions = employee.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .distinct()
                .sorted()
                .toList();
        return new CurrentUserResponse(
                employee.getId(),
                employee.getEmail(),
                employee.getFirstName(),
                employee.getLastName(),
                Boolean.TRUE.equals(employee.getMustChangePassword()),
                roles,
                permissions
        );
    }
}
