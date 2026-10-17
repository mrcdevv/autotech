package com.autotech.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record TestEmailRequest(

        @NotBlank(message = "Ingresá un email de destino")
        @Email(message = "Formato de email inválido")
        String to
) {}
