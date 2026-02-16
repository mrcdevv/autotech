package com.autotech.client.dto;

import com.autotech.client.model.ClientType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ClientUpgradeRequest(
        @NotBlank(message = "El DNI es obligatorio para clientes registrados") @Size(max = 20, message = "El DNI no puede exceder 20 caracteres") String dni,

        @Size(max = 150, message = "El nombre comercial no puede exceder 150 caracteres") String commercialName,

        @Email(message = "El correo electrónico no tiene un formato válido") @Size(max = 255, message = "El correo no puede exceder 255 caracteres") String email,

        @NotBlank(message = "La dirección es obligatoria para clientes registrados") @Size(max = 255, message = "La dirección no puede exceder 255 caracteres") String address,

        @NotBlank(message = "La provincia es obligatoria para clientes registrados") @Size(max = 100, message = "La provincia no puede exceder 100 caracteres") String province,

        @NotBlank(message = "El país es obligatorio para clientes registrados") @Size(max = 100, message = "El país no puede exceder 100 caracteres") String country,

        @NotNull(message = "El tipo de cliente es obligatorio") ClientType clientType,

        LocalDate entryDate) {
}
