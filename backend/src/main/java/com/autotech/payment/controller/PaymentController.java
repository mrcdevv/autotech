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
@RequestMapping("/api/invoices/{invoiceId}/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByInvoice(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getByInvoiceId(invoiceId)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PaymentSummaryResponse>> getSummary(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getSummary(invoiceId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @PathVariable Long invoiceId,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse created = paymentService.create(invoiceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pago registrado", created));
    }

    @PutMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> update(
            @PathVariable Long invoiceId,
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Pago actualizado", paymentService.update(paymentId, request)));
    }

    @DeleteMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long invoiceId,
            @PathVariable Long paymentId,
            @RequestParam Long performedBy) {
        paymentService.delete(paymentId, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Pago eliminado", null));
    }
}
