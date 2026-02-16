package com.autotech.vehicle.dto;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.model.VehicleType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VehicleMapperTest {

    private final VehicleMapper mapper = new VehicleMapper();

    @Test
    void givenVehicle_whenToResponse_thenMapAllFields() {
        // Arrange
        Client client = Client.builder()
                .firstName("Juan").lastName("Perez").dni("12345678")
                .phone("1234567890").clientType(ClientType.PERSONAL).build();
        client.setId(1L);

        Brand brand = Brand.builder().name("Toyota").build();
        brand.setId(2L);

        VehicleType vt = VehicleType.builder().name("AUTO").build();
        vt.setId(3L);

        Vehicle vehicle = Vehicle.builder()
                .client(client).plate("ABC123").chassisNumber("CH001")
                .engineNumber("EN001").brand(brand).model("Corolla")
                .year(2020).vehicleType(vt).observations("Test").build();
        vehicle.setId(10L);

        // Act
        VehicleResponse response = mapper.toResponse(vehicle);

        // Assert
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.clientId()).isEqualTo(1L);
        assertThat(response.clientFirstName()).isEqualTo("Juan");
        assertThat(response.clientLastName()).isEqualTo("Perez");
        assertThat(response.clientDni()).isEqualTo("12345678");
        assertThat(response.plate()).isEqualTo("ABC123");
        assertThat(response.brandId()).isEqualTo(2L);
        assertThat(response.brandName()).isEqualTo("Toyota");
        assertThat(response.vehicleTypeId()).isEqualTo(3L);
        assertThat(response.vehicleTypeName()).isEqualTo("AUTO");
    }

    @Test
    void givenRequest_whenToEntity_thenMapScalarFields() {
        // Arrange
        VehicleRequest request = new VehicleRequest(1L, "XYZ789", "CH002", "EN002", 1L, "Hilux", 2022, 1L, "Obs");

        // Act
        Vehicle entity = mapper.toEntity(request);

        // Assert
        assertThat(entity.getPlate()).isEqualTo("XYZ789");
        assertThat(entity.getChassisNumber()).isEqualTo("CH002");
        assertThat(entity.getModel()).isEqualTo("Hilux");
        assertThat(entity.getYear()).isEqualTo(2022);
        assertThat(entity.getClient()).isNull();
        assertThat(entity.getBrand()).isNull();
        assertThat(entity.getVehicleType()).isNull();
    }

    @Test
    void givenNullVehicle_whenToResponse_thenReturnNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void givenNullRequest_whenToEntity_thenReturnNull() {
        assertThat(mapper.toEntity(null)).isNull();
    }
}
