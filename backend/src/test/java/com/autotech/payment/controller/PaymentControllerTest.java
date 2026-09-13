package com.autotech.payment.controller;

import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.payment.dto.PaymentRequest;
import com.autotech.payment.dto.PaymentResponse;
import com.autotech.payment.dto.PaymentSummaryResponse;
import com.autotech.payment.model.PaymentType;
import com.autotech.payment.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

@WebMvcTest(PaymentController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentService paymentService;

    private final PaymentResponse sampleResponse = new PaymentResponse(
            1L, 10L, LocalDate.now(), LocalDateTime.now(),
            BigDecimal.valueOf(500), "Juan Perez", PaymentType.EFECTIVO,
            null, null, null, null, null);

    private final PaymentSummaryResponse sampleSummary = new PaymentSummaryResponse(
            BigDecimal.valueOf(1000), BigDecimal.valueOf(200),
            new BigDecimal("226.80"), BigDecimal.valueOf(120),
            new BigDecimal("1306.80"), BigDecimal.valueOf(500),
            new BigDecimal("806.80"));

    @Test
    void givenPaymentsExist_whenGetByInvoice_thenReturn200() throws Exception {
        when(paymentService.getByInvoiceId(10L)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/invoices/10/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    void givenInvoiceExists_whenGetSummary_thenReturn200() throws Exception {
        when(paymentService.getSummary(10L)).thenReturn(sampleSummary);

        mockMvc.perform(get("/api/invoices/10/payments/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalServices").value(1000));
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(500), "Juan", PaymentType.EFECTIVO, null, null);
        when(paymentService.create(eq(10L), any(PaymentRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/invoices/10/payments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.message").value("Pago registrado"));
    }

    @Test
    void givenInvalidRequest_whenCreate_thenReturn400() throws Exception {
        PaymentRequest request = new PaymentRequest(null, null, null, null, null, null);

        mockMvc.perform(post("/api/invoices/10/payments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenAmountExceedsRemaining_whenCreate_thenReturn400() throws Exception {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(5000), null, PaymentType.EFECTIVO, null, null);
        when(paymentService.create(eq(10L), any(PaymentRequest.class)))
                .thenThrow(new BusinessException("El monto del pago no puede superar el restante por pagar"));

        mockMvc.perform(post("/api/invoices/10/payments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(300), "Updated", PaymentType.EFECTIVO, null, null);
        when(paymentService.update(eq(1L), any(PaymentRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/invoices/10/payments/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Pago actualizado"));
    }

    @Test
    void givenNonExistentPayment_whenUpdate_thenReturn404() throws Exception {
        PaymentRequest request = new PaymentRequest(
                LocalDate.now(), BigDecimal.valueOf(100), null, PaymentType.EFECTIVO, null, null);
        when(paymentService.update(eq(99L), any(PaymentRequest.class)))
                .thenThrow(new ResourceNotFoundException("Payment", 99L));

        mockMvc.perform(put("/api/invoices/10/payments/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenExistingPayment_whenDelete_thenReturn200() throws Exception {
        doNothing().when(paymentService).delete(1L, 5L);

        mockMvc.perform(delete("/api/invoices/10/payments/1")
                        .param("performedBy", "5")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Pago eliminado"));
    }

    @Test
    void givenNonExistentPayment_whenDelete_thenReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Payment", 99L)).when(paymentService).delete(99L, 5L);

        mockMvc.perform(delete("/api/invoices/10/payments/99")
                        .param("performedBy", "5")
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
