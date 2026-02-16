package com.autotech.invoice.dto;

import java.math.BigDecimal;

public record InvoiceServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}
