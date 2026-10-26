package com.autotech.estimate.controller;

import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.estimate.dto.PublicEstimateResponse;
import com.autotech.estimate.model.EstimateDecisionChannel;
import com.autotech.estimate.model.EstimateStatus;
import com.autotech.estimate.service.EstimateService;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs with the real SecurityConfig and no authenticated user: the public endpoints must be reachable anonymously.
 */
@WebMvcTest(PublicEstimateController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class PublicEstimateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstimateService estimateService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private PublicEstimateResponse response(EstimateStatus status, boolean canDecide) {
        return new PublicEstimateResponse(318L, "Martín", "Toyota Corolla (AB 123 CD)", List.of(), List.of(), List.of(),
                BigDecimal.ZERO, BigDecimal.valueOf(21), BigDecimal.valueOf(175400), status,
                status == EstimateStatus.PENDIENTE ? null : EstimateDecisionChannel.EMAIL_LINK,
                null, LocalDateTime.now().plusDays(7), canDecide);
    }

    @Test
    void givenAnonymousUser_whenGetByToken_thenReturn200() throws Exception {
        when(estimateService.getByApprovalToken("tok")).thenReturn(response(EstimateStatus.PENDIENTE, true));

        mockMvc.perform(get("/api/public/estimates/tok"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estimateNumber").value(318))
                .andExpect(jsonPath("$.data.canDecide").value(true));
    }

    @Test
    void givenAnonymousUser_whenApprove_thenReturn200() throws Exception {
        when(estimateService.approveByToken("tok")).thenReturn(response(EstimateStatus.ACEPTADO, false));

        mockMvc.perform(post("/api/public/estimates/tok/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACEPTADO"));
    }

    @Test
    void givenExpiredLink_whenReject_thenReturn400() throws Exception {
        when(estimateService.rejectByToken("tok"))
                .thenThrow(new BusinessException("El enlace venció. Comunicate con el taller para recibir uno nuevo"));

        mockMvc.perform(post("/api/public/estimates/tok/reject"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El enlace venció. Comunicate con el taller para recibir uno nuevo"));
    }
}
