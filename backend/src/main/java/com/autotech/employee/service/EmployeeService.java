package com.autotech.employee.service;

import com.autotech.employee.dto.EmployeeRequest;
import com.autotech.employee.dto.EmployeeResponse;
import com.autotech.employee.model.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EmployeeService {

    Page<EmployeeResponse> getAll(Pageable pageable);

    EmployeeResponse getById(Long id);

    EmployeeResponse create(EmployeeRequest request);

    EmployeeResponse update(Long id, EmployeeRequest request);

    void delete(Long id);

    Page<EmployeeResponse> searchByDni(String dni, Pageable pageable);

    Page<EmployeeResponse> filterByStatus(EmployeeStatus status, Pageable pageable);

    Page<EmployeeResponse> filterByRole(Long roleId, Pageable pageable);

    EmployeeResponse assignRoles(Long employeeId, List<Long> roleIds);

    byte[] exportToExcel();
}
