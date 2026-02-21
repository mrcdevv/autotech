package com.autotech.employee.dto;

import com.autotech.employee.model.Employee;
import com.autotech.role.dto.RoleResponse;
import com.autotech.role.model.Role;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EmployeeMapper {

    public EmployeeResponse toResponse(Employee entity) {
        if (entity == null) return null;

        List<RoleResponse> roles = entity.getRoles().stream()
                .map(this::toRoleResponse)
                .toList();

        return new EmployeeResponse(
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getDni(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getAddress(),
                entity.getProvince(),
                entity.getCity(),
                entity.getCountry(),
                entity.getMaritalStatus(),
                entity.getChildrenCount(),
                entity.getEntryDate(),
                entity.getStatus(),
                roles,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Employee toEntity(EmployeeRequest request) {
        if (request == null) return null;

        return Employee.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .dni(request.dni())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .province(request.province())
                .city(request.city())
                .country(request.country())
                .maritalStatus(request.maritalStatus())
                .childrenCount(request.childrenCount())
                .entryDate(request.entryDate())
                .status(request.status())
                .build();
    }

    public RoleResponse toRoleResponse(Role role) {
        if (role == null) return null;
        return new RoleResponse(role.getId(), role.getName(), role.getDescription());
    }

    public List<EmployeeResponse> toResponseList(List<Employee> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }
}
