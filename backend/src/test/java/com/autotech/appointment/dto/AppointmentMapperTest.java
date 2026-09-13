package com.autotech.appointment.dto;

import com.autotech.appointment.model.Appointment;
import com.autotech.appointment.model.CalendarConfig;
import com.autotech.appointment.model.VehicleDeliveryMethod;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.employee.model.Employee;
import com.autotech.tag.model.Tag;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AppointmentMapperTest {

    private final AppointmentMapper mapper = new AppointmentMapper();

    private final LocalDateTime startTime = LocalDateTime.of(2025, 3, 15, 10, 0);
    private final LocalDateTime endTime = LocalDateTime.of(2025, 3, 15, 11, 0);

    @Test
    void givenAppointment_whenToResponse_thenMapsAllFields() {
        // Arrange
        Appointment entity = buildFullAppointment();

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("Test");
        assertThat(response.purpose()).isEqualTo("Purpose");
        assertThat(response.startTime()).isEqualTo(startTime);
        assertThat(response.endTime()).isEqualTo(endTime);
        assertThat(response.vehicleDeliveryMethod()).isEqualTo(VehicleDeliveryMethod.PROPIO);
        assertThat(response.clientArrived()).isFalse();
    }

    @Test
    void givenAppointmentWithClient_whenToResponse_thenMapsClientFields() {
        // Arrange
        Appointment entity = buildFullAppointment();

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.clientId()).isEqualTo(1L);
        assertThat(response.clientFullName()).isEqualTo("Juan Perez");
    }

    @Test
    void givenAppointmentWithVehicle_whenToResponse_thenMapsVehicleFields() {
        // Arrange
        Appointment entity = buildFullAppointment();

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.vehicleId()).isEqualTo(1L);
        assertThat(response.vehiclePlate()).isEqualTo("ABC123");
        assertThat(response.vehicleBrand()).isEqualTo("Toyota");
        assertThat(response.vehicleModel()).isEqualTo("Corolla");
    }

    @Test
    void givenAppointmentWithEmployeesAndTags_whenToResponse_thenMapsThem() {
        // Arrange
        Appointment entity = buildFullAppointment();

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.employees()).hasSize(1);
        assertThat(response.employees().getFirst().firstName()).isEqualTo("Carlos");
        assertThat(response.tags()).hasSize(1);
        assertThat(response.tags().getFirst().name()).isEqualTo("Urgente");
    }

    @Test
    void givenAppointmentWithNullClient_whenToResponse_thenHandlesNull() {
        // Arrange
        Appointment entity = Appointment.builder()
                .title("No client")
                .startTime(startTime)
                .endTime(endTime)
                .build();
        entity.setId(2L);

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.clientId()).isNull();
        assertThat(response.clientFullName()).isNull();
    }

    @Test
    void givenAppointmentWithNullVehicle_whenToResponse_thenHandlesNull() {
        // Arrange
        Appointment entity = Appointment.builder()
                .title("No vehicle")
                .startTime(startTime)
                .endTime(endTime)
                .build();
        entity.setId(3L);

        // Act
        AppointmentResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.vehicleId()).isNull();
        assertThat(response.vehiclePlate()).isNull();
        assertThat(response.vehicleBrand()).isNull();
        assertThat(response.vehicleModel()).isNull();
    }

    @Test
    void givenRequest_whenToEntity_thenIgnoresRelations() {
        // Arrange
        AppointmentRequest request = new AppointmentRequest(
                "Test", 1L, 1L, "Purpose", startTime, endTime,
                VehicleDeliveryMethod.GRUA, java.util.List.of(1L), java.util.List.of(1L));

        // Act
        Appointment entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getTitle()).isEqualTo("Test");
        assertThat(entity.getStartTime()).isEqualTo(startTime);
        assertThat(entity.getClient()).isNull();
        assertThat(entity.getVehicle()).isNull();
        assertThat(entity.getEmployees()).isEmpty();
        assertThat(entity.getTags()).isEmpty();
    }

    @Test
    void givenCalendarConfig_whenToResponse_thenMapsAllFields() {
        // Arrange
        CalendarConfig config = CalendarConfig.builder()
                .defaultAppointmentDurationMinutes(45)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(18, 0))
                .build();
        config.setId(1L);

        // Act
        CalendarConfigResponse response = mapper.toCalendarConfigResponse(config);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.defaultAppointmentDurationMinutes()).isEqualTo(45);
        assertThat(response.startTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(response.endTime()).isEqualTo(LocalTime.of(18, 0));
    }

    // --- Helpers ---

    private Appointment buildFullAppointment() {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .phone("123")
                .clientType(ClientType.PERSONAL)
                .build();
        client.setId(1L);

        Brand brand = Brand.builder().name("Toyota").build();
        brand.setId(1L);

        Vehicle vehicle = Vehicle.builder()
                .client(client)
                .plate("ABC123")
                .brand(brand)
                .model("Corolla")
                .build();
        vehicle.setId(1L);

        Employee employee = Employee.builder()
                .firstName("Carlos")
                .lastName("Lopez")
                .dni("99887766")
                .phone("5551234")
                .build();
        employee.setId(1L);

        Tag tag = Tag.builder().name("Urgente").color("#FF0000").build();
        tag.setId(1L);

        Appointment appointment = Appointment.builder()
                .title("Test")
                .client(client)
                .vehicle(vehicle)
                .purpose("Purpose")
                .startTime(startTime)
                .endTime(endTime)
                .vehicleDeliveryMethod(VehicleDeliveryMethod.PROPIO)
                .employees(Set.of(employee))
                .tags(Set.of(tag))
                .build();
        appointment.setId(1L);
        return appointment;
    }
}
