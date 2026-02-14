package com.autotech.employee.service;

import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.employee.dto.EmployeeMapper;
import com.autotech.employee.dto.EmployeeRequest;
import com.autotech.employee.dto.EmployeeResponse;
import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> getAll(Pageable pageable) {
        log.debug("Fetching all employees, page: {}", pageable.getPageNumber());
        return employeeRepository.findAll(pageable)
                .map(employeeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long id) {
        log.debug("Fetching employee with id: {}", id);
        Employee employee = employeeRepository.findWithRolesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", id));
        return employeeMapper.toResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        log.info("Creating employee with DNI: {}", request.dni());

        if (employeeRepository.existsByDni(request.dni())) {
            throw new DuplicateResourceException("Ya existe un empleado con el DNI ingresado");
        }

        Employee employee = employeeMapper.toEntity(request);
        Set<Role> roles = resolveRoles(request.roleIds());
        employee.setRoles(roles);

        Employee saved = employeeRepository.save(employee);
        log.info("Employee created with id: {}", saved.getId());
        return employeeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        log.info("Updating employee with id: {}", id);

        Employee employee = employeeRepository.findWithRolesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", id));

        if (employeeRepository.existsByDniAndIdNot(request.dni(), id)) {
            throw new DuplicateResourceException("Ya existe un empleado con el DNI ingresado");
        }

        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setDni(request.dni());
        employee.setEmail(request.email());
        employee.setPhone(request.phone());
        employee.setAddress(request.address());
        employee.setProvince(request.province());
        employee.setCountry(request.country());
        employee.setMaritalStatus(request.maritalStatus());
        employee.setChildrenCount(request.childrenCount());
        employee.setEntryDate(request.entryDate());
        employee.setStatus(request.status());

        Set<Role> roles = resolveRoles(request.roleIds());
        employee.getRoles().clear();
        employee.getRoles().addAll(roles);

        Employee saved = employeeRepository.save(employee);
        log.info("Employee updated with id: {}", saved.getId());
        return employeeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Deleting employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", id));
        employeeRepository.delete(employee);
        log.info("Employee deleted with id: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> searchByDni(String dni, Pageable pageable) {
        log.debug("Searching employees by DNI: {}", dni);
        return employeeRepository.searchByDni(dni, pageable)
                .map(employeeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> filterByStatus(EmployeeStatus status, Pageable pageable) {
        log.debug("Filtering employees by status: {}", status);
        return employeeRepository.findByStatus(status, pageable)
                .map(employeeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> filterByRole(Long roleId, Pageable pageable) {
        log.debug("Filtering employees by role id: {}", roleId);
        return employeeRepository.findByRoleId(roleId, pageable)
                .map(employeeMapper::toResponse);
    }

    @Override
    @Transactional
    public EmployeeResponse assignRoles(Long employeeId, List<Long> roleIds) {
        log.info("Assigning roles {} to employee {}", roleIds, employeeId);

        Employee employee = employeeRepository.findWithRolesById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado", employeeId));

        Set<Role> roles = resolveRoles(roleIds);
        employee.getRoles().clear();
        employee.getRoles().addAll(roles);

        Employee saved = employeeRepository.save(employee);
        log.info("Roles assigned to employee {}", employeeId);
        return employeeMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToExcel() {
        log.info("Exporting employees to Excel");
        List<Employee> employees = employeeRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Empleados");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"DNI", "Nombre Completo", "Teléfono", "Email", "Estado", "Roles"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Employee employee : employees) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(employee.getDni());
                row.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                row.createCell(2).setCellValue(employee.getPhone());
                row.createCell(3).setCellValue(employee.getEmail() != null ? employee.getEmail() : "");
                row.createCell(4).setCellValue(employee.getStatus().name());
                String roleNames = employee.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.joining(", "));
                row.createCell(5).setCellValue(roleNames);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error exporting employees to Excel", e);
            throw new RuntimeException("Error al exportar empleados a Excel", e);
        }
    }

    private Set<Role> resolveRoles(List<Long> roleIds) {
        List<Role> roles = roleRepository.findByIdIn(roleIds);
        if (roles.size() != roleIds.size()) {
            List<Long> foundIds = roles.stream().map(Role::getId).toList();
            List<Long> missingIds = roleIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            throw new ResourceNotFoundException(
                    "No se encontró el rol con ID " + missingIds.getFirst());
        }
        return new HashSet<>(roles);
    }
}
