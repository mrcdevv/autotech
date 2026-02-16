package com.autotech.invoice.controller;

import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.invoice.dto.InvoiceDetailResponse;
import com.autotech.invoice.dto.InvoiceRequest;
import com.autotech.invoice.dto.InvoiceResponse;
import com.autotech.invoice.model.InvoiceStatus;
import com.autotech.invoice.service.InvoiceService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InvoiceController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InvoiceService invoiceService;

    private final InvoiceResponse sampleResponse = new InvoiceResponse(
            1L, 1L, "Juan Perez", 2L, "ABC123", "Corolla", null, null,
            InvoiceStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.valueOf(400), LocalDateTime.now(), LocalDateTime.now());

    private final InvoiceDetailResponse sampleDetailResponse = new InvoiceDetailResponse(
            1L, 1L, "Juan Perez", "12345678", "1234567890", null, "PERSONAL",
            2L, "ABC123", null, "Corolla", 2020, null, null,
            InvoiceStatus.PENDIENTE, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.valueOf(400), Collections.emptyList(), Collections.emptyList(),
            LocalDateTime.now(), LocalDateTime.now());

    @Test
    void givenInvoicesExist_whenGetAll_thenReturn200() throws Exception {
        Page<InvoiceResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 12), 1);
        when(invoiceService.getAll(any())).thenReturn(page);

        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].clientFullName").value("Juan Perez"));
    }

    @Test
    void givenFilters_whenGetAllWithFilters_thenReturn200() throws Exception {
        Page<InvoiceResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 12), 1);
        when(invoiceService.search(any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/invoices").param("clientName", "Juan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].clientFullName").value("Juan Perez"));
    }

    @Test
    void givenValidId_whenGetById_thenReturn200() throws Exception {
        when(invoiceService.getById(1L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(get("/api/invoices/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenGetById_thenReturn404() throws Exception {
        when(invoiceService.getById(99L)).thenThrow(new ResourceNotFoundException("Invoice", 99L));

        mockMvc.perform(get("/api/invoices/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        InvoiceRequest request = new InvoiceRequest(1L, 2L, null, null,
                BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());
        when(invoiceService.create(any(InvoiceRequest.class))).thenReturn(sampleDetailResponse);

        mockMvc.perform(post("/api/invoices")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        InvoiceRequest request = new InvoiceRequest(null, null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/invoices")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidEstimateId_whenCreateFromEstimate_thenReturn201() throws Exception {
        when(invoiceService.createFromEstimate(5L)).thenReturn(sampleDetailResponse);

        mockMvc.perform(post("/api/invoices/from-estimate/5").with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.message").value("Factura creada desde presupuesto"));
    }

    @Test
    void givenNonAcceptedEstimate_whenCreateFromEstimate_thenReturn400() throws Exception {
        when(invoiceService.createFromEstimate(5L))
                .thenThrow(new BusinessException("Solo se pueden facturar presupuestos en estado ACEPTADO"));

        mockMvc.perform(post("/api/invoices/from-estimate/5").with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        doNothing().when(invoiceService).delete(1L);

        mockMvc.perform(delete("/api/invoices/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Factura eliminada"));
    }

    @Test
    void givenNonExistentId_whenDelete_thenReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Invoice", 99L)).when(invoiceService).delete(99L);

        mockMvc.perform(delete("/api/invoices/99").with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenRepairOrderInvoice_whenDelete_thenReturn400() throws Exception {
        doThrow(new BusinessException("No se puede eliminar una factura asociada a una orden de trabajo"))
                .when(invoiceService).delete(1L);

        mockMvc.perform(delete("/api/invoices/1").with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
