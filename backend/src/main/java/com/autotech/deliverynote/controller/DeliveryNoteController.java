package com.autotech.deliverynote.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.deliverynote.dto.DeliveryNoteDetailResponse;
import com.autotech.deliverynote.dto.DeliveryNoteRequest;
import com.autotech.deliverynote.dto.DeliveryNoteResponse;
import com.autotech.deliverynote.model.DeliveryNoteStatus;
import com.autotech.deliverynote.service.DeliveryNotePdfService;
import com.autotech.deliverynote.service.DeliveryNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-notes")
@RequiredArgsConstructor
public class DeliveryNoteController {

    private final DeliveryNoteService deliveryNoteService;
    private final DeliveryNotePdfService deliveryNotePdfService;

    @PreAuthorize("hasAuthority('read_delivery_note')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DeliveryNoteResponse>>> getAll(
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) DeliveryNoteStatus status,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (clientName != null || plate != null || status != null) {
            return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.search(clientName, plate, status, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.getAll(pageable)));
    }

    @PreAuthorize("hasAuthority('read_delivery_note')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(deliveryNoteService.getById(id)));
    }

    @PreAuthorize("hasAuthority('create_delivery_note')")
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> create(
            @Valid @RequestBody DeliveryNoteRequest request) {
        DeliveryNoteDetailResponse created = deliveryNoteService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Remito creado", created));
    }

    @PreAuthorize("hasAuthority('create_delivery_note')")
    @PostMapping("/from-estimate/{estimateId}")
    public ResponseEntity<ApiResponse<DeliveryNoteDetailResponse>> createFromEstimate(
            @PathVariable Long estimateId) {
        DeliveryNoteDetailResponse created = deliveryNoteService.createFromEstimate(estimateId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Remito creado desde presupuesto", created));
    }

    @PreAuthorize("hasAuthority('read_delivery_note')")
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = deliveryNotePdfService.generate(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"remito-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PreAuthorize("hasAuthority('delete_delivery_note')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        deliveryNoteService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Remito eliminado", null));
    }
}
