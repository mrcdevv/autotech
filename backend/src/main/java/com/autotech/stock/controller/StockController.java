package com.autotech.stock.controller;

import com.autotech.catalog.dto.ProductResponse;
import com.autotech.common.dto.ApiResponse;
import com.autotech.stock.dto.StockAdjustmentRequest;
import com.autotech.stock.dto.StockMovementResponse;
import com.autotech.stock.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{productId}")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @PreAuthorize("hasAuthority('manage_stock')")
    @PostMapping("/stock-adjustments")
    public ResponseEntity<ApiResponse<ProductResponse>> adjust(
            @PathVariable Long productId,
            @Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Stock ajustado", stockService.adjust(productId, request)));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/stock-movements")
    public ResponseEntity<ApiResponse<Page<StockMovementResponse>>> getMovements(
            @PathVariable Long productId,
            @PageableDefault(size = 20, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(stockService.getMovements(productId, pageable)));
    }
}
