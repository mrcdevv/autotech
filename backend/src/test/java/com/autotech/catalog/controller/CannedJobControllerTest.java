package com.autotech.catalog.controller;

import com.autotech.catalog.dto.CannedJobDetailResponse;
import com.autotech.catalog.dto.CannedJobProductResponse;
import com.autotech.catalog.dto.CannedJobRequest;
import com.autotech.catalog.dto.CannedJobResponse;
import com.autotech.catalog.dto.CannedJobServiceResponse;
import com.autotech.catalog.service.CannedJobService;
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

@WebMvcTest(CannedJobController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class CannedJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CannedJobService cannedJobService;

    private final CannedJobResponse sampleResponse = new CannedJobResponse(
            1L, "Full Service", "Complete vehicle service",
            LocalDateTime.now(), LocalDateTime.now());

    private final CannedJobDetailResponse sampleDetailResponse = new CannedJobDetailResponse(
            1L, "Full Service", "Complete vehicle service",
            List.of(new CannedJobServiceResponse(1L, "Oil Change", new BigDecimal("50.00"))),
            List.of(new CannedJobProductResponse(1L, "Oil Filter", 1, new BigDecimal("15.00"))),
            LocalDateTime.now(), LocalDateTime.now());

    @Test
    void givenRequest_whenSearch_thenReturn200() throws Exception {
        // Arrange
        when(cannedJobService.search(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        // Act & Assert
        mockMvc.perform(get("/api/canned-jobs").param("query", "full"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Full Service"));
    }

    @Test
    void givenExistingId_whenGetById_thenReturn200() throws Exception {
        // Arrange
        when(cannedJobService.getById(1L)).thenReturn(sampleDetailResponse);

        // Act & Assert
        mockMvc.perform(get("/api/canned-jobs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Full Service"))
                .andExpect(jsonPath("$.data.services[0].serviceName").value("Oil Change"));
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("Full Service", "Complete", List.of(), List.of());
        when(cannedJobService.create(any(CannedJobRequest.class))).thenReturn(sampleDetailResponse);

        // Act & Assert
        mockMvc.perform(post("/api/canned-jobs").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Full Service"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("", null, List.of(), List.of());

        // Act & Assert
        mockMvc.perform(post("/api/canned-jobs").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        // Arrange
        CannedJobRequest request = new CannedJobRequest("Updated", "Updated desc", List.of(), List.of());
        when(cannedJobService.update(eq(1L), any(CannedJobRequest.class))).thenReturn(sampleDetailResponse);

        // Act & Assert
        mockMvc.perform(put("/api/canned-jobs/1").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/canned-jobs/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Trabajo enlatado eliminado"));
    }
}
