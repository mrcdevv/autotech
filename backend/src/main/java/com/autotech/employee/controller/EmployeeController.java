package com.autotech.employee.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.employee.dto.EmployeeRequest;
import com.autotech.employee.dto.EmployeeResponse;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse created = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Empleado creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Empleado actualizado", employeeService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Empleado eliminado", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> searchByDni(
            @RequestParam String dni, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.searchByDni(dni, pageable)));
    }

    @GetMapping("/filter/status")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> filterByStatus(
            @RequestParam EmployeeStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.filterByStatus(status, pageable)));
    }

    @GetMapping("/filter/role")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> filterByRole(
            @RequestParam Long roleId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.filterByRole(roleId, pageable)));
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<EmployeeResponse>> assignRoles(
            @PathVariable Long id,
            @Valid @RequestBody List<Long> roleIds) {
        return ResponseEntity.ok(ApiResponse.success("Roles actualizados", employeeService.assignRoles(id, roleIds)));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel() {
        byte[] file = employeeService.exportToExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=empleados.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(file);
    }
}
