package com.autotech.estimate.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.service.EstimateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EstimateResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) EstimateStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
            return ResponseEntity.ok(ApiResponse.success(estimateService.search(clientName, plate, status, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(estimateService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> create(
            @Valid @RequestBody EstimateRequest request) {
        EstimateDetailResponse created = estimateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Presupuesto creado", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EstimateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto actualizado", estimateService.update(id, request)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto aceptado", estimateService.approve(id)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto rechazado", estimateService.reject(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        estimateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto eliminado", null));
    }

    @GetMapping("/{id}/invoice-data")
    public ResponseEntity<ApiResponse<EstimateInvoiceDataResponse>> getInvoiceData(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.convertToInvoiceData(id)));
    }
}
