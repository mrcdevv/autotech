package com.autotech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(

        @NotBlank(message = "El enlace de recuperación es inválido")
        String token,

        @NotBlank(message = "La nueva contraseña no puede estar vacía")
        @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
        String newPassword
) {}
