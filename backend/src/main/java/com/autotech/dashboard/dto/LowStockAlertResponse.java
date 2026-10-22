package com.autotech.dashboard.dto;

public record LowStockAlertResponse(
        Long productId,
        String productName,
        Integer quantity,
        Integer reservedQuantity,
        Integer availableQuantity,
        Integer minStock
) {}
