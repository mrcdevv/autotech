package com.autotech.estimate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record EstimateRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        @NotNull(message = "El vehículo es obligatorio")
        Long vehicleId,

        Long repairOrderId,

        @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El descuento no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal discountPercentage,

        @DecimalMin(value = "0.00", message = "El impuesto no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El impuesto no puede superar el 100%")
        @Digits(integer = 3, fraction = 2)
        BigDecimal taxPercentage,

        @Valid
        List<EstimateServiceItemRequest> services,

        @Valid
        List<EstimateProductRequest> products
) {}
