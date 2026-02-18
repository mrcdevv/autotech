package com.autotech.estimate.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.estimate.dto.EstimateDetailResponse;
import com.autotech.estimate.dto.EstimateInvoiceDataResponse;
import com.autotech.estimate.dto.EstimateRequest;
import com.autotech.estimate.dto.EstimateResponse;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.service.EstimateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EstimateController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class EstimateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EstimateService estimateService;

    private final EstimateResponse sampleResponse = new EstimateResponse(
            1L, 1L, "Juan Perez", 2L, "ABC123", "Corolla", null,
            EstimateStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.valueOf(400), LocalDateTime.now(), LocalDateTime.now()
    );

    private final EstimateDetailResponse sampleDetailResponse = new EstimateDetailResponse(
            1L, 1L, "Juan Perez", "12345678", "1234567890", null,
            2L, "ABC123", null, "Corolla", 2020, null,
            null, Collections.emptyList(), EstimateStatus.PENDIENTE,
            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(400),
            Collections.emptyList(), Collections.emptyList(),
            LocalDateTime.now(), LocalDateTime.now()
    );

    @Test
    void givenEstimatesExist_whenGetAll_thenReturn200() throws Exception {
        Page<EstimateResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 12), 1);
        when(estimateService.getAll(any())).thenReturn(page);

        mockMvc.perform(get("/api/estimates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].clientFullName").value("Juan Perez"));
    }

    @Test
    void givenFilters_whenGetAllWithFilters_thenReturn200() throws Exception {
        Page<EstimateResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 12), 1);
        when(estimateService.search(eq("Juan"), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/estimates").param("clientName", "Juan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].clientFullName").value("Juan Perez"));
    }

    @Test
    void givenValidId_whenGetById_thenReturn200() throws Exception {
        when(estimateService.getById(1L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(get("/api/estimates/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenGetById_thenReturn404() throws Exception {
        when(estimateService.getById(99L)).thenThrow(new ResourceNotFoundException("Estimate", 99L));

        mockMvc.perform(get("/api/estimates/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());
        when(estimateService.create(any(EstimateRequest.class))).thenReturn(sampleDetailResponse);

        mockMvc.perform(post("/api/estimates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        EstimateRequest request = new EstimateRequest(null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/estimates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());
        when(estimateService.update(eq(1L), any(EstimateRequest.class))).thenReturn(sampleDetailResponse);

        mockMvc.perform(put("/api/estimates/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenUpdate_thenReturn404() throws Exception {
        EstimateRequest request = new EstimateRequest(1L, 2L, null, BigDecimal.ZERO, BigDecimal.ZERO,
                Collections.emptyList(), Collections.emptyList());
        when(estimateService.update(eq(99L), any(EstimateRequest.class)))
                .thenThrow(new ResourceNotFoundException("Estimate", 99L));

        mockMvc.perform(put("/api/estimates/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenPendienteEstimate_whenApprove_thenReturn200() throws Exception {
        when(estimateService.approve(1L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(put("/api/estimates/1/approve").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Presupuesto aceptado"));
    }

    @Test
    void givenPendienteEstimate_whenReject_thenReturn200() throws Exception {
        when(estimateService.reject(1L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(put("/api/estimates/1/reject").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Presupuesto rechazado"));
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        doNothing().when(estimateService).delete(1L);

        mockMvc.perform(delete("/api/estimates/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Presupuesto eliminado"));
    }

    @Test
    void givenNonExistentId_whenDelete_thenReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Estimate", 99L)).when(estimateService).delete(99L);

        mockMvc.perform(delete("/api/estimates/99").with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenAceptadoEstimate_whenGetInvoiceData_thenReturn200() throws Exception {
        EstimateInvoiceDataResponse invoiceData = new EstimateInvoiceDataResponse(
                1L, 1L, 2L, null, Collections.emptyList(), Collections.emptyList(),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(400)
        );
        when(estimateService.convertToInvoiceData(1L)).thenReturn(invoiceData);

        mockMvc.perform(get("/api/estimates/1/invoice-data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estimateId").value(1));
    }
}
