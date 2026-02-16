package com.autotech.catalog.controller;

import com.autotech.catalog.dto.CatalogServiceRequest;
import com.autotech.catalog.dto.CatalogServiceResponse;
import com.autotech.catalog.service.CatalogServiceService;
import com.autotech.common.exception.GlobalExceptionHandler;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CatalogServiceController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class CatalogServiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CatalogServiceService catalogServiceService;

    private final CatalogServiceResponse sampleResponse = new CatalogServiceResponse(
            1L, "Oil Change", "Full oil change", new BigDecimal("50.00"),
            LocalDateTime.now(), LocalDateTime.now());

    @Test
    void givenRequest_whenSearch_thenReturn200() throws Exception {
        // Arrange
        when(catalogServiceService.search(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        // Act & Assert
        mockMvc.perform(get("/api/services").param("query", "oil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.content[0].name").value("Oil Change"));
    }

    @Test
    void givenExistingId_whenGetById_thenReturn200() throws Exception {
        // Arrange
        when(catalogServiceService.getById(1L)).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(get("/api/services/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Oil Change"));
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("Oil Change", "Full oil change", new BigDecimal("50.00"));
        when(catalogServiceService.create(any(CatalogServiceRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(post("/api/services").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Oil Change"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("", null, null);

        // Act & Assert
        mockMvc.perform(post("/api/services").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        // Arrange
        CatalogServiceRequest request = new CatalogServiceRequest("Updated", "Updated desc", new BigDecimal("75.00"));
        when(catalogServiceService.update(eq(1L), any(CatalogServiceRequest.class))).thenReturn(sampleResponse);

        // Act & Assert
        mockMvc.perform(put("/api/services/1").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/services/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Servicio eliminado"));
    }
}
