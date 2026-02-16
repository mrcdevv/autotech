package com.autotech.vehicle.service;

import com.autotech.client.model.Client;
import com.autotech.client.model.ClientType;
import com.autotech.client.service.ClientService;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.vehicle.dto.VehicleMapper;
import com.autotech.vehicle.dto.VehicleRequest;
import com.autotech.vehicle.dto.VehicleResponse;
import com.autotech.vehicle.model.Brand;
import com.autotech.vehicle.model.Vehicle;
import com.autotech.vehicle.model.VehicleType;
import com.autotech.vehicle.repository.BrandRepository;
import com.autotech.vehicle.repository.VehicleRepository;
import com.autotech.vehicle.repository.VehicleTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleMapper vehicleMapper;

    @Mock
    private ClientService clientService;

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private VehicleTypeRepository vehicleTypeRepository;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    private final Pageable pageable = PageRequest.of(0, 12);

    @Test
    void givenValidId_whenGetById_thenReturnVehicleResponse() {
        // Arrange
        Vehicle entity = buildVehicle(1L);
        VehicleResponse response = buildResponse(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(vehicleMapper.toResponse(entity)).thenReturn(response);

        // Act
        VehicleResponse result = vehicleService.getById(1L);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.plate()).isEqualTo("ABC123");
    }

    @Test
    void givenInvalidId_whenGetById_thenThrowResourceNotFoundException() {
        // Arrange
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> vehicleService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnCreatedVehicle() {
        // Arrange
        VehicleRequest request = buildRequest();
        Client client = buildClient();
        Brand brand = buildBrand(1L);
        VehicleType vehicleType = buildVehicleType(1L);
        Vehicle entity = buildVehicle(null);
        Vehicle saved = buildVehicle(1L);
        VehicleResponse response = buildResponse(1L);

        when(vehicleRepository.existsByPlate("ABC123")).thenReturn(false);
        when(clientService.findEntityById(1L)).thenReturn(client);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));
        when(vehicleTypeRepository.findById(1L)).thenReturn(Optional.of(vehicleType));
        when(vehicleMapper.toEntity(request)).thenReturn(entity);
        when(vehicleRepository.save(entity)).thenReturn(saved);
        when(vehicleMapper.toResponse(saved)).thenReturn(response);

        // Act
        VehicleResponse result = vehicleService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.plate()).isEqualTo("ABC123");
    }

    @Test
    void givenDuplicatePlate_whenCreate_thenThrowIllegalArgumentException() {
        // Arrange
        VehicleRequest request = buildRequest();
        when(vehicleRepository.existsByPlate("ABC123")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> vehicleService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("patente");
    }

    @Test
    void givenNonExistentClient_whenCreate_thenThrowResourceNotFoundException() {
        // Arrange
        VehicleRequest request = buildRequest();
        when(vehicleRepository.existsByPlate("ABC123")).thenReturn(false);
        when(clientService.findEntityById(1L)).thenThrow(new ResourceNotFoundException("Client", 1L));

        // Act & Assert
        assertThatThrownBy(() -> vehicleService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Client");
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedVehicle() {
        // Arrange
        VehicleRequest request = buildRequest();
        Client client = buildClient();
        Brand brand = buildBrand(1L);
        VehicleType vehicleType = buildVehicleType(1L);
        Vehicle existing = buildVehicle(1L);
        Vehicle saved = buildVehicle(1L);
        VehicleResponse response = buildResponse(1L);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(vehicleRepository.existsByPlateAndIdNot("ABC123", 1L)).thenReturn(false);
        when(clientService.findEntityById(1L)).thenReturn(client);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(brand));
        when(vehicleTypeRepository.findById(1L)).thenReturn(Optional.of(vehicleType));
        when(vehicleRepository.save(existing)).thenReturn(saved);
        when(vehicleMapper.toResponse(saved)).thenReturn(response);

        // Act
        VehicleResponse result = vehicleService.update(1L, request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void givenDuplicatePlateOnOtherVehicle_whenUpdate_thenThrowIllegalArgumentException() {
        // Arrange
        VehicleRequest request = buildRequest();
        Vehicle existing = buildVehicle(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(vehicleRepository.existsByPlateAndIdNot("ABC123", 1L)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> vehicleService.update(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("patente");
    }

    @Test
    void givenValidId_whenDelete_thenVehicleIsRemoved() {
        // Arrange
        Vehicle vehicle = buildVehicle(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        // Act
        vehicleService.delete(1L);

        // Assert
        verify(vehicleRepository).delete(vehicle);
    }

    @Test
    void givenInvalidId_whenDelete_thenThrowResourceNotFoundException() {
        // Arrange
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> vehicleService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void givenPlateQuery_whenSearchByPlate_thenReturnMatchingVehicles() {
        // Arrange
        Vehicle entity = buildVehicle(1L);
        VehicleResponse response = buildResponse(1L);
        Page<Vehicle> entityPage = new PageImpl<>(List.of(entity));

        when(vehicleRepository.findByPlateContainingIgnoreCase("ABC", pageable)).thenReturn(entityPage);
        when(vehicleMapper.toResponse(entity)).thenReturn(response);

        // Act
        Page<VehicleResponse> result = vehicleService.searchByPlate("ABC", pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().plate()).isEqualTo("ABC123");
    }

    @Test
    void givenClientId_whenGetByClientId_thenReturnClientVehicles() {
        // Arrange
        Vehicle entity = buildVehicle(1L);
        VehicleResponse response = buildResponse(1L);

        when(vehicleRepository.findByClientId(1L)).thenReturn(List.of(entity));
        when(vehicleMapper.toResponse(entity)).thenReturn(response);

        // Act
        List<VehicleResponse> result = vehicleService.getByClientId(1L);

        // Assert
        assertThat(result).hasSize(1);
    }

    // --- Helpers ---

    private VehicleRequest buildRequest() {
        return new VehicleRequest(1L, "ABC123", "CHASSIS001", "ENGINE001", 1L, "Corolla", 2020, 1L, null);
    }

    private Client buildClient() {
        Client client = Client.builder()
                .firstName("Juan")
                .lastName("Perez")
                .dni("12345678")
                .phone("1234567890")
                .clientType(ClientType.PERSONAL)
                .build();
        client.setId(1L);
        return client;
    }

    private Brand buildBrand(Long id) {
        Brand brand = Brand.builder().name("Toyota").build();
        if (id != null) brand.setId(id);
        return brand;
    }

    private VehicleType buildVehicleType(Long id) {
        VehicleType vt = VehicleType.builder().name("AUTO").build();
        if (id != null) vt.setId(id);
        return vt;
    }

    private Vehicle buildVehicle(Long id) {
        Vehicle vehicle = Vehicle.builder()
                .client(buildClient())
                .plate("ABC123")
                .chassisNumber("CHASSIS001")
                .engineNumber("ENGINE001")
                .brand(buildBrand(1L))
                .model("Corolla")
                .year(2020)
                .vehicleType(buildVehicleType(1L))
                .build();
        if (id != null) vehicle.setId(id);
        return vehicle;
    }

    private VehicleResponse buildResponse(Long id) {
        return new VehicleResponse(id, 1L, "Juan", "Perez", "12345678", "ABC123",
                "CHASSIS001", "ENGINE001", 1L, "Toyota", "Corolla", 2020, 1L, "AUTO",
                null, LocalDateTime.now());
    }
}
