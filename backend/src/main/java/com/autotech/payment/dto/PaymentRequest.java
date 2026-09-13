package com.autotech.payment.dto;

import com.autotech.payment.model.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull(message = "La fecha de pago es obligatoria")
        LocalDate paymentDate,

        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
        @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 10 dígitos enteros y 2 decimales")
        BigDecimal amount,

        @Size(max = 200, message = "El nombre del pagador no puede superar los 200 caracteres")
        String payerName,

        @NotNull(message = "El tipo de pago es obligatorio")
        PaymentType paymentType,

        Long bankAccountId,

        Long registeredByEmployeeId
) {}
