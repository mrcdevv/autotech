package com.autotech.estimate.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.estimate.dto.PublicEstimateResponse;
import com.autotech.estimate.service.EstimateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints behind the personal approval link emailed to the client. No authentication: the token is the credential.
 */
@RestController
@RequestMapping("/api/public/estimates")
@RequiredArgsConstructor
public class PublicEstimateController {

    private final EstimateService estimateService;

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<PublicEstimateResponse>> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(estimateService.getByApprovalToken(token)));
    }

    @PostMapping("/{token}/approve")
    public ResponseEntity<ApiResponse<PublicEstimateResponse>> approve(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success("¡Gracias! Aprobaste el presupuesto. Ya avisamos al taller",
                estimateService.approveByToken(token)));
    }

    @PostMapping("/{token}/reject")
    public ResponseEntity<ApiResponse<PublicEstimateResponse>> reject(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success("Registramos que no aprobaste el presupuesto. El taller se va a comunicar con vos",
                estimateService.rejectByToken(token)));
    }
}
