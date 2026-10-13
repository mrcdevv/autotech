package com.autotech.estimate.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateDeliveryNoteDataResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasAuthority('read_estimate')")
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

    @PreAuthorize("hasAuthority('read_estimate')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getById(id)));
    }

    @PreAuthorize("hasAuthority('create_estimate')")
    @PostMapping
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> create(
            @Valid @RequestBody EstimateRequest request) {
        EstimateDetailResponse created = estimateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Presupuesto creado", created));
    }

    @PreAuthorize("hasAuthority('update_estimate')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EstimateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto actualizado", estimateService.update(id, request)));
    }

    @PreAuthorize("hasAuthority('update_estimate')")
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto aceptado", estimateService.approve(id)));
    }

    @PreAuthorize("hasAuthority('update_estimate')")
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<EstimateDetailResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Presupuesto rechazado", estimateService.reject(id)));
    }

    @PreAuthorize("hasAuthority('delete_estimate')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        estimateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto eliminado", null));
    }

    @PreAuthorize("hasAuthority('read_estimate')")
    @GetMapping("/{id}/delivery-note-data")
    public ResponseEntity<ApiResponse<EstimateDeliveryNoteDataResponse>> getDeliveryNoteData(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.convertToDeliveryNoteData(id)));
    }
}
