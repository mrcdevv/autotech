package com.autotech.employee.dto;

import com.autotech.employee.model.EmployeeStatus;
import com.autotech.role.dto.RoleResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record EmployeeResponse(
    Long id,
    String firstName,
    String lastName,
    String dni,
    String email,
    String phone,
    String address,
    String province,
    String city,
    String country,
    String maritalStatus,
    Integer childrenCount,
    LocalDate entryDate,
    EmployeeStatus status,
    List<RoleResponse> roles,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
