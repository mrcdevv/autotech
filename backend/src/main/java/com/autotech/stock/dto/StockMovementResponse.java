package com.autotech.stock.dto;

import com.autotech.stock.model.StockMovementType;
import com.autotech.stock.model.StockSourceType;

import java.time.LocalDateTime;

public record StockMovementResponse(
        Long id,
        Long productId,
        StockMovementType type,
        Integer quantity,
        StockSourceType sourceType,
        Long sourceId,
        String reason,
        String createdByName,
        LocalDateTime createdAt
) {}
