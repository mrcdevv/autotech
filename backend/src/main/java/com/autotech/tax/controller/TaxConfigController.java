package com.autotech.tax.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.tax.dto.TaxConfigRequest;
import com.autotech.tax.dto.TaxConfigResponse;
import com.autotech.tax.model.TaxConfig;
import com.autotech.tax.service.TaxConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tax-config")
@RequiredArgsConstructor
public class TaxConfigController {

    private final TaxConfigService taxConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<TaxConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(toResponse(taxConfigService.getConfig())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<TaxConfigResponse>> updateConfig(
            @Valid @RequestBody TaxConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(taxConfigService.updateConfig(request))));
    }

    private TaxConfigResponse toResponse(TaxConfig config) {
        return new TaxConfigResponse(
                config.getId(),
                config.getTaxPercentage(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
