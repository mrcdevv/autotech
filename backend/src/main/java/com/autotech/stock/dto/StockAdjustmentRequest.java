package com.autotech.stock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockAdjustmentRequest(
        @NotNull(message = "El tipo de ajuste es obligatorio")
        StockAdjustmentMode mode,

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 0, message = "La cantidad no puede ser negativa")
        Integer quantity,

        @NotBlank(message = "El motivo del ajuste es obligatorio")
        @Size(max = 500, message = "El motivo no puede superar los 500 caracteres")
        String reason
) {}
