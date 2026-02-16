package com.autotech.repairorder.dto;

import com.autotech.appointment.model.Appointment;
import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.employee.model.Employee;
import com.autotech.repairorder.model.RepairOrder;
import com.autotech.repairorder.model.RepairOrderStatus;
import com.autotech.tag.model.Tag;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RepairOrderMapperTest {

    private final RepairOrderMapper mapper = new RepairOrderMapper();

    @Test
    void givenRepairOrder_whenToResponse_thenMapsAllFieldsIncludingNestedEmployeesAndTags() {
        // Arrange
        RepairOrder entity = buildFullRepairOrder();

        // Act
        RepairOrderResponse response = mapper.toResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("OT-1 Perez - ABC123");
        assertThat(response.status()).isEqualTo(RepairOrderStatus.INGRESO_VEHICULO);
        assertThat(response.clientId()).isEqualTo(1L);
        assertThat(response.clientFirstName()).isEqualTo("Juan");
        assertThat(response.clientLastName()).isEqualTo("Perez");
        assertThat(response.clientPhone()).isEqualTo("1234567890");
        assertThat(response.vehicleId()).isEqualTo(1L);
        assertThat(response.vehiclePlate()).isEqualTo("ABC123");
        assertThat(response.vehicleBrandName()).isEqualTo("Toyota");
        assertThat(response.vehicleModel()).isEqualTo("Corolla");
        assertThat(response.vehicleYear()).isEqualTo(2020);
        assertThat(response.employees()).hasSize(1);
        assertThat(response.employees().getFirst().firstName()).isEqualTo("Carlos");
        assertThat(response.tags()).hasSize(1);
        assertThat(response.tags().getFirst().name()).isEqualTo("Urgente");
    }

    @Test
    void givenRepairOrder_whenToDetailResponse_thenMapsAllFieldsExceptWorkHistory() {
        // Arrange
        RepairOrder entity = buildFullRepairOrder();

        // Act
        RepairOrderDetailResponse response = mapper.toDetailResponse(entity);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.reason()).isEqualTo("Engine noise");
        assertThat(response.clientDni()).isNull();
        assertThat(response.clientEmail()).isNull();
        assertThat(response.vehicleChassisNumber()).isEqualTo("CHASSIS001");
        assertThat(response.appointmentId()).isEqualTo(10L);
        assertThat(response.workHistory()).isNull();
    }

    @Test
    void givenEmployee_whenToEmployeeSummary_thenMapsCorrectly() {
        // Arrange
        Employee employee = Employee.builder()
                .firstName("Carlos")
                .lastName("Lopez")
                .dni("99887766")
                .phone("5551234")
                .build();
        employee.setId(1L);

        // Act
        RepairOrderResponse.EmployeeSummary summary = mapper.toEmployeeSummary(employee);

        // Assert
        assertThat(summary.id()).isEqualTo(1L);
        assertThat(summary.firstName()).isEqualTo("Carlos");
        assertThat(summary.lastName()).isEqualTo("Lopez");
    }

    @Test
    void givenTag_whenToTagResponse_thenMapsCorrectly() {
        // Arrange
        Tag tag = Tag.builder().name("Urgente").color("#FF0000").build();
        tag.setId(1L);

        // Act
        RepairOrderResponse.TagResponse response = mapper.toTagResponse(tag);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Urgente");
        assertThat(response.color()).isEqualTo("#FF0000");
    }

    @Test
    void givenNull_whenToResponse_thenReturnsNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void givenNull_whenToDetailResponse_thenReturnsNull() {
        assertThat(mapper.toDetailResponse(null)).isNull();
    }

    // --- Helpers ---

    private RepairOrder buildFullRepairOrder() {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .phone("1234567890")
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
                .year(2020)
                .chassisNumber("CHASSIS001")
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
                .title("Test Appointment")
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(1))
                .build();
        appointment.setId(10L);

        RepairOrder order = RepairOrder.builder()
                .title("OT-1 Perez - ABC123")
                .client(client)
                .vehicle(vehicle)
                .appointment(appointment)
                .reason("Engine noise")
                .status(RepairOrderStatus.INGRESO_VEHICULO)
                .employees(Set.of(employee))
                .tags(Set.of(tag))
                .build();
        order.setId(1L);
        return order;
    }
}
