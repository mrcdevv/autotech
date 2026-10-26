package com.autotech.deliverynote.dto;

import java.math.BigDecimal;

public record DeliveryNoteServiceItemResponse(
        Long id,
        String serviceName,
        BigDecimal price
) {}
