package com.autotech.appointment.dto;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.CalendarConfig;
import com.autotech.employee.model.Employee;
import com.autotech.tag.model.Tag;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AppointmentMapper {

    public AppointmentResponse toResponse(Appointment entity) {
        if (entity == null) return null;
        return new AppointmentResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getClient() != null ? entity.getClient().getId() : null,
                entity.getClient() != null
                        ? entity.getClient().getFirstName() + " " + entity.getClient().getLastName()
                        : null,
                entity.getVehicle() != null ? entity.getVehicle().getId() : null,
                entity.getVehicle() != null ? entity.getVehicle().getPlate() : null,
                entity.getVehicle() != null && entity.getVehicle().getBrand() != null
                        ? entity.getVehicle().getBrand().getName()
                        : null,
                entity.getVehicle() != null ? entity.getVehicle().getModel() : null,
                entity.getPurpose(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getVehicleDeliveryMethod(),
                entity.getVehicleArrivedAt(),
                entity.getVehiclePickedUpAt(),
                entity.getClientArrived(),
                entity.getEmployees() != null
                        ? entity.getEmployees().stream().map(this::toEmployeeSummaryResponse).toList()
                        : List.of(),
                entity.getTags() != null
                        ? entity.getTags().stream().map(this::toAppointmentTagResponse).toList()
                        : List.of(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Appointment toEntity(AppointmentRequest request) {
        if (request == null) return null;
        return Appointment.builder()
                .title(request.title())
                .purpose(request.purpose())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .vehicleDeliveryMethod(request.vehicleDeliveryMethod())
                .build();
    }

    public EmployeeSummaryResponse toEmployeeSummaryResponse(Employee employee) {
        if (employee == null) return null;
        return new EmployeeSummaryResponse(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName()
        );
    }

    public AppointmentTagResponse toAppointmentTagResponse(Tag tag) {
        if (tag == null) return null;
        return new AppointmentTagResponse(
                tag.getId(),
                tag.getName(),
                tag.getColor()
        );
    }

    public CalendarConfigResponse toCalendarConfigResponse(CalendarConfig entity) {
        if (entity == null) return null;
        return new CalendarConfigResponse(
                entity.getId(),
                entity.getDefaultAppointmentDurationMinutes(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
