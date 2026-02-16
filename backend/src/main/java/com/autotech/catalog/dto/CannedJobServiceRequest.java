package com.autotech.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CannedJobServiceRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String serviceName,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2)
        BigDecimal price
) {}
