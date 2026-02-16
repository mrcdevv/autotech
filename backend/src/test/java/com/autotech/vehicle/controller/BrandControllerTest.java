package com.autotech.vehicle.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.vehicle.dto.BrandRequest;
import com.autotech.vehicle.dto.BrandResponse;
import com.autotech.vehicle.service.BrandService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BrandController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class BrandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BrandService brandService;

    private final BrandResponse sampleResponse = new BrandResponse(1L, "Toyota", LocalDateTime.now());

    @Test
    void givenValidRequest_whenCreateBrand_thenReturnCreatedStatus() throws Exception {
        // Arrange
        BrandRequest request = new BrandRequest("Toyota");
        when(brandService.create(any(BrandRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(post("/api/brands").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Toyota"));
    }

    @Test
    void givenInvalidRequest_whenCreateBrand_thenReturn400() throws Exception {
        // Arrange
        BrandRequest request = new BrandRequest("");

        // Act & Assert
        mockMvc.perform(post("/api/brands").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenExistingId_whenDelete_thenReturnOk() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/brands/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Marca eliminada"));
    }
}
