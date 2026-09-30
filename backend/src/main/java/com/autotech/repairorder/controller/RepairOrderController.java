package com.autotech.repairorder.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.service.EstimateService;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.service.InvoiceService;
import com.autotech.repairorder.dto.NotesUpdateRequest;
import com.autotech.repairorder.dto.RepairOrderDetailResponse;
import com.autotech.repairorder.dto.RepairOrderFilter;
import com.autotech.repairorder.dto.RepairOrderRequest;
import com.autotech.repairorder.dto.RepairOrderResponse;
import com.autotech.repairorder.dto.StatusUpdateRequest;
import com.autotech.repairorder.dto.TitleUpdateRequest;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.repairorder.service.RepairOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/repair-orders")
@RequiredArgsConstructor
public class RepairOrderController {

    private final RepairOrderService repairOrderService;
    private final EstimateService estimateService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RepairOrderResponse>>> search(
            @RequestParam(required = false) List<RepairOrderStatus> statuses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        RepairOrderFilter filter = new RepairOrderFilter(statuses, from, to, employeeId, tagId, q);
        return ResponseEntity.ok(ApiResponse.success(repairOrderService.search(filter, pageable)));
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

    @PatchMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<RepairOrderDetailResponse>> updateNotes(
            @PathVariable Long id,
            @RequestBody NotesUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Notas actualizadas", repairOrderService.updateNotes(id, request)));
    }

    @PatchMapping("/{id}/title")
    public ResponseEntity<ApiResponse<RepairOrderResponse>> updateTitle(
            @PathVariable Long id,
            @Valid @RequestBody TitleUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Título actualizado", repairOrderService.updateTitle(id, request)));
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

    @GetMapping("/{id}/estimate")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> getEstimateByRepairOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getByRepairOrderId(id)));
    }

    @GetMapping("/{id}/estimates")
    public ResponseEntity<ApiResponse<List<EstimateResponse>>> getAllEstimatesByRepairOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getAllByRepairOrderId(id)));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> getInvoiceByRepairOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getByRepairOrderId(id)));
    }
}
