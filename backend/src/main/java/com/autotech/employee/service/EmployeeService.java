package com.autotech.employee.service;

import com.autotech.employee.dto.EmployeeRequest;
import com.autotech.employee.dto.EmployeeResponse;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface EmployeeService {

    Page<EmployeeResponse> getAll(Pageable pageable);

    EmployeeResponse getById(Long id);

    EmployeeResponse create(EmployeeRequest request);

    EmployeeResponse update(Long id, EmployeeRequest request);

    Page<EmployeeResponse> searchByDni(String dni, Pageable pageable);

    Page<EmployeeResponse> filterByStatus(EmployeeStatus status, Pageable pageable);

    Page<EmployeeResponse> filterByRole(Long roleId, Pageable pageable);

    EmployeeResponse assignRoles(Long employeeId, List<Long> roleIds);

    void resetPassword(Long id);

    byte[] exportToExcel();

    /**
     * Validates that the given employees may be assigned to work (repair order or appointment).
     *
     * <p>Rule (D12): an inactive employee must never be newly assigned to work. An inactive
     * employee who is already assigned to the record may be kept, because assignment requests
     * carry a full replacement set: re-sending a current assignment is an edit, not a new
     * assignment. Deactivation must not erase an employee from the history of what they did.
     *
     * @param candidates the employees the caller resolved for the incoming assignment set
     * @param alreadyAssignedIds ids of employees already assigned to the record being edited
     *                           (empty for a new record)
     * @throws BusinessException if a candidate is inactive and not already assigned
     */
    void validateActiveAssignees(Collection<Employee> candidates, Set<Long> alreadyAssignedIds);
}
