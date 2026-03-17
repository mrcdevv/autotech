package com.autotech.repairorder.dto;

import com.autotech.employee.model.Employee;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.tag.model.Tag;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RepairOrderMapper {

    public RepairOrderResponse toResponse(RepairOrder entity) {
        if (entity == null) return null;
        return new RepairOrderResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getStatus(),
                entity.getClient().getId(),
                entity.getClient().getFirstName(),
                entity.getClient().getLastName(),
                entity.getClient().getPhone(),
                entity.getVehicle().getId(),
                entity.getVehicle().getPlate(),
                entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null,
                entity.getVehicle().getModel(),
                entity.getVehicle().getYear(),
                entity.getEmployees() != null
                        ? entity.getEmployees().stream().map(this::toEmployeeSummary).toList()
                        : List.of(),
                entity.getTags() != null
                        ? entity.getTags().stream().map(this::toTagResponse).toList()
                        : List.of(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public RepairOrderDetailResponse toDetailResponse(RepairOrder entity) {
        if (entity == null) return null;
        return new RepairOrderDetailResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getStatus(),
                entity.getReason(),
                entity.getClientSource(),
                entity.getMechanicNotes(),
                entity.getAppointment() != null ? entity.getAppointment().getId() : null,
                entity.getClient().getId(),
                entity.getClient().getFirstName(),
                entity.getClient().getLastName(),
                entity.getClient().getDni(),
                entity.getClient().getPhone(),
                entity.getClient().getEmail(),
                entity.getVehicle().getId(),
                entity.getVehicle().getPlate(),
                entity.getVehicle().getBrand() != null ? entity.getVehicle().getBrand().getName() : null,
                entity.getVehicle().getModel(),
                entity.getVehicle().getYear(),
                entity.getVehicle().getChassisNumber(),
                entity.getEmployees() != null
                        ? entity.getEmployees().stream().map(this::toEmployeeSummary).toList()
                        : List.of(),
                entity.getTags() != null
                        ? entity.getTags().stream().map(this::toTagResponse).toList()
                        : List.of(),
                null,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public RepairOrderResponse.EmployeeSummary toEmployeeSummary(Employee employee) {
        if (employee == null) return null;
        return new RepairOrderResponse.EmployeeSummary(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName()
        );
    }

    public RepairOrderResponse.TagResponse toTagResponse(Tag tag) {
        if (tag == null) return null;
        return new RepairOrderResponse.TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getColor()
        );
    }
}
