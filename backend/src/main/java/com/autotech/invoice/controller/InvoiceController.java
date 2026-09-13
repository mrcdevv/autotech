package com.autotech.invoice.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceRequest;
import com.autotech.invoice.dto.InvoiceResponse;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.service.InvoiceService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
            return ResponseEntity.ok(ApiResponse.success(invoiceService.search(clientName, plate, status, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> create(
            @Valid @RequestBody InvoiceRequest request) {
        InvoiceDetailResponse created = invoiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Factura creada", created));
    }

    @PostMapping("/from-estimate/{estimateId}")
    public ResponseEntity<ApiResponse<InvoiceDetailResponse>> createFromEstimate(
            @PathVariable Long estimateId) {
        InvoiceDetailResponse created = invoiceService.createFromEstimate(estimateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Factura creada desde presupuesto", created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        invoiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Factura eliminada", null));
    }
}
