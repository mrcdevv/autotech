package com.autotech.bankaccount.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BankAccountRequest(
        @NotNull(message = "El banco es obligatorio")
        Long bankId,

        @NotBlank(message = "El alias es obligatorio")
        @Size(max = 100, message = "El alias no puede superar los 100 caracteres")
        String alias,

        @Size(max = 30, message = "El CBU/CVU no puede superar los 30 caracteres")
        String cbuCvu
) {}
