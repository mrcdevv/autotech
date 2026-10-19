package com.autotech.payment.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.payment.dto.PaymentRequest;
import com.autotech.payment.dto.PaymentResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

@RestController
@RequestMapping("/api/delivery-notes/{deliveryNoteId}/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PreAuthorize("hasAuthority('read_payment')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByDeliveryNote(
            @PathVariable Long deliveryNoteId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getByDeliveryNoteId(deliveryNoteId)));
    }

    @PreAuthorize("hasAuthority('read_payment')")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PaymentSummaryResponse>> getSummary(
            @PathVariable Long deliveryNoteId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getSummary(deliveryNoteId)));
    }

    @PreAuthorize("hasAuthority('create_payment')")
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @PathVariable Long deliveryNoteId,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse created = paymentService.create(deliveryNoteId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pago registrado", created));
    }

    @PreAuthorize("hasAuthority('update_payment')")
    @PutMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> update(
            @PathVariable Long deliveryNoteId,
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Pago actualizado", paymentService.update(paymentId, request)));
    }

    @PreAuthorize("hasAuthority('delete_payment')")
    @DeleteMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long deliveryNoteId,
            @PathVariable Long paymentId,
            @RequestParam Long performedBy) {
        paymentService.delete(paymentId, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Pago eliminado", null));
    }
}
