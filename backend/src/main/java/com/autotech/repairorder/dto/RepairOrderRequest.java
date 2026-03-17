package com.autotech.repairorder.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RepairOrderRequest(

        @NotNull(message = "El cliente es obligatorio")
        Long clientId,

        @NotNull(message = "El vehículo es obligatorio")
        Long vehicleId,

        Long appointmentId,

        @Size(max = 5000, message = "El motivo no puede superar los 5000 caracteres")
        String reason,

        @Size(max = 100, message = "El origen del cliente no puede superar los 100 caracteres")
        String clientSource,

        List<Long> employeeIds,

        List<Long> tagIds
) {}
