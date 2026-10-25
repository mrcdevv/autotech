package com.autotech.deliverynote.dto;

import java.math.BigDecimal;

public record DeliveryNoteProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        Long productId
) {}
