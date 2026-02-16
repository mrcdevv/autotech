package com.autotech.vehicle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VehicleRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        @NotBlank(message = "La patente es obligatoria")
        @Size(max = 20, message = "La patente no puede superar los 20 caracteres")
        String plate,

        @Size(max = 50, message = "El número de chasis no puede superar los 50 caracteres")
        String chassisNumber,

        @Size(max = 50, message = "El número de motor no puede superar los 50 caracteres")
        String engineNumber,

        Long brandId,

        @Size(max = 100, message = "El modelo no puede superar los 100 caracteres")
        String model,

        Integer year,

        Long vehicleTypeId,

        String observations
) {}
