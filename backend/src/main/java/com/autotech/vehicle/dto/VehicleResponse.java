package com.autotech.vehicle.dto;

import java.time.LocalDateTime;

public record VehicleResponse(
        Long id,
        Long clientId,
        String clientFirstName,
        String clientLastName,
        String clientDni,
        String plate,
        String chassisNumber,
        String engineNumber,
        Long brandId,
        String brandName,
        String model,
        Integer year,
        Long vehicleTypeId,
        String vehicleTypeName,
        String observations,
        LocalDateTime createdAt
) {}
