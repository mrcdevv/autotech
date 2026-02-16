package com.autotech.repairorder.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.service.RepairOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/repair-orders")
@RequiredArgsConstructor
public class RepairOrderController {

    private final RepairOrderService repairOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RepairOrderDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RepairOrderResponse>> create(
            @Valid @RequestBody RepairOrderRequest request) {
        RepairOrderResponse created = repairOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Orden de trabajo creada", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RepairOrderRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Orden de trabajo actualizada", repairOrderService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repairOrderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Orden de trabajo eliminada", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Estado actualizado", repairOrderService.updateStatus(id, request)));
    }

    @PatchMapping("/{id}/title")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> updateTitle(
            @PathVariable Long id,
            @Valid @RequestBody TitleUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Título actualizado", repairOrderService.updateTitle(id, request)));
    }

    @GetMapping("/by-status")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> getByStatus(
            @RequestParam List<RepairOrderStatus> statuses) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.getByStatus(statuses)));
    }

    @PutMapping("/{id}/employees")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> assignEmployees(
            @PathVariable Long id,
            @RequestBody List<Long> employeeIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Empleados asignados", repairOrderService.assignEmployees(id, employeeIds)));
    }

    @PutMapping("/{id}/tags")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> assignTags(
            @PathVariable Long id,
            @RequestBody List<Long> tagIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Etiquetas asignadas", repairOrderService.assignTags(id, tagIds)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> search(
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.search(query)));
    }

    @GetMapping("/filter/by-employee")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> filterByEmployee(
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.filterByEmployee(employeeId)));
    }

    @GetMapping("/filter/by-tag")
    public ResponseEntity<ApiResponse<List<RepairOrderResponse>>> filterByTag(
            @RequestParam Long tagId) {
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.filterByTag(tagId)));
    }
}
