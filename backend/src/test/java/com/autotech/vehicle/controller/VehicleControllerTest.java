package com.autotech.vehicle.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.vehicle.dto.VehicleRequest;
import com.autotech.vehicle.dto.VehicleResponse;
import com.autotech.vehicle.service.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VehicleController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VehicleService vehicleService;

    private final VehicleResponse sampleResponse = new VehicleResponse(
            1L, 1L, "Juan", "Perez", "12345678", "ABC123",
            "CHASSIS001", "ENGINE001", 1L, "Toyota", "Corolla",
            2020, 1L, "AUTO", null, false, LocalDateTime.now());

    @Test
    void givenValidRequest_whenCreateVehicle_thenReturnCreatedStatus() throws Exception {
        // Arrange
        VehicleRequest request = new VehicleRequest(1L, "ABC123", "CHASSIS001", "ENGINE001", 1L, "Corolla", 2020, 1L, null);
        when(vehicleService.create(any(VehicleRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(post("/api/vehicles").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.plate").value("ABC123"));
    }

    @Test
    void givenExistingVehicle_whenGetById_thenReturnOk() throws Exception {
        // Arrange
        when(vehicleService.getById(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(get("/api/vehicles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.plate").value("ABC123"));
    }

    @Test
    void givenInvalidRequest_whenCreateVehicle_thenReturn400() throws Exception {
        // Arrange
        VehicleRequest request = new VehicleRequest(null, "", null, null, null, null, null, null, null);

        // Act & Assert
        mockMvc.perform(post("/api/vehicles").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenPlateQuery_whenSearch_thenReturnMatchingResults() throws Exception {
        // Arrange
        when(vehicleService.searchByPlate(eq("AB"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        // Act & Assert
        mockMvc.perform(get("/api/vehicles/search").param("plate", "AB"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].plate").value("ABC123"));
    }

    @Test
    void givenExistingId_whenDelete_thenReturnOk() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/vehicles/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vehículo eliminado"));
    }
}
