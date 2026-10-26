package com.autotech.tax.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TaxConfigRequest(
        @NotNull(message = "El porcentaje de IVA es obligatorio")
        @DecimalMin(value = "0.00", message = "El porcentaje de IVA no puede ser negativo")
        @DecimalMax(value = "100.00", message = "El porcentaje de IVA no puede superar el 100%")
        @Digits(integer = 3, fraction = 2, message = "El porcentaje de IVA debe tener como máximo 3 dígitos enteros y 2 decimales")
        BigDecimal taxPercentage
) {}
