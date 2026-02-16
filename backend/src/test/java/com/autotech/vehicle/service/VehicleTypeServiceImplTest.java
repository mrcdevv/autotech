package com.autotech.vehicle.service;

import com.autotech.vehicle.dto.VehicleTypeResponse;
import com.autotech.vehicle.model.VehicleType;
import com.autotech.vehicle.repository.VehicleTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleTypeServiceImplTest {

    @Mock
    private VehicleTypeRepository vehicleTypeRepository;

    @InjectMocks
    private VehicleTypeServiceImpl vehicleTypeService;

    @Test
    void whenGetAll_thenReturnAllVehicleTypes() {
        // Arrange
        VehicleType auto = VehicleType.builder().name("AUTO").build();
        auto.setId(1L);
        VehicleType camioneta = VehicleType.builder().name("CAMIONETA").build();
        camioneta.setId(2L);
        VehicleType utilitario = VehicleType.builder().name("UTILITARIO").build();
        utilitario.setId(3L);

        when(vehicleTypeRepository.findAll()).thenReturn(List.of(auto, camioneta, utilitario));

        // Act
        List<VehicleTypeResponse> result = vehicleTypeService.getAll();

        // Assert
        assertThat(result).hasSize(3);
        assertThat(result.get(0).name()).isEqualTo("AUTO");
        assertThat(result.get(1).name()).isEqualTo("CAMIONETA");
        assertThat(result.get(2).name()).isEqualTo("UTILITARIO");
    }
}
