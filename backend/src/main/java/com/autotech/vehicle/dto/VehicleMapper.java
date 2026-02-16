package com.autotech.vehicle.dto;

import com.autotech.vehicle.model.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public VehicleResponse toResponse(Vehicle entity) {
        if (entity == null) return null;
        return new VehicleResponse(
                entity.getId(),
                entity.getClient() != null ? entity.getClient().getId() : null,
                entity.getClient() != null ? entity.getClient().getFirstName() : null,
                entity.getClient() != null ? entity.getClient().getLastName() : null,
                entity.getClient() != null ? entity.getClient().getDni() : null,
                entity.getPlate(),
                entity.getChassisNumber(),
                entity.getEngineNumber(),
                entity.getBrand() != null ? entity.getBrand().getId() : null,
                entity.getBrand() != null ? entity.getBrand().getName() : null,
                entity.getModel(),
                entity.getYear(),
                entity.getVehicleType() != null ? entity.getVehicleType().getId() : null,
                entity.getVehicleType() != null ? entity.getVehicleType().getName() : null,
                entity.getObservations(),
                entity.getCreatedAt()
        );
    }

    public Vehicle toEntity(VehicleRequest request) {
        if (request == null) return null;
        return Vehicle.builder()
                .plate(request.plate())
                .chassisNumber(request.chassisNumber())
                .engineNumber(request.engineNumber())
                .model(request.model())
                .year(request.year())
                .observations(request.observations())
                .build();
    }
}
