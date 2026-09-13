package com.autotech.invoice.dto;

import java.math.BigDecimal;

public record InvoiceProductResponse(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
