package com.autotech.dashboard.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.dashboard.dto.DashboardConfigRequest;
import com.autotech.dashboard.dto.DashboardFinancieroResponse;
import com.autotech.dashboard.dto.DashboardProductividadResponse;
import com.autotech.dashboard.dto.DashboardSummaryResponse;
import com.autotech.dashboard.model.DashboardConfig;
import com.autotech.dashboard.service.DashboardExportService;
import com.autotech.dashboard.service.DashboardService;
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
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private DashboardExportService dashboardExportService;

    @Test
    void givenData_whenGetSummary_thenReturn200() throws Exception {
        // Arrange
        DashboardSummaryResponse summary = new DashboardSummaryResponse(
                5L, 2L, 3L, 4L,
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyList(), 5);
        when(dashboardService.getSummary()).thenReturn(summary);

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.openRepairOrderCount").value(5))
                .andExpect(jsonPath("$.data.readyForPickupCount").value(2))
                .andExpect(jsonPath("$.data.todayAppointmentCount").value(3))
                .andExpect(jsonPath("$.data.pendingEstimateCount").value(4))
                .andExpect(jsonPath("$.data.staleThresholdDays").value(5));
    }

    @Test
    void givenData_whenGetFinanciero_thenReturn200() throws Exception {
        // Arrange
        DashboardFinancieroResponse financiero = new DashboardFinancieroResponse(
                Collections.emptyList(), new BigDecimal("80"), 8L, 10L,
                new BigDecimal("15000"), Collections.emptyList(), Collections.emptyList());
        when(dashboardService.getFinanciero(6)).thenReturn(financiero);

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/financiero"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estimateConversionRate").value(80))
                .andExpect(jsonPath("$.data.estimatesAccepted").value(8))
                .andExpect(jsonPath("$.data.totalPendingBilling").value(15000));
    }

    @Test
    void givenCustomMonths_whenGetFinanciero_thenReturn200() throws Exception {
        // Arrange
        DashboardFinancieroResponse financiero = new DashboardFinancieroResponse(
                Collections.emptyList(), BigDecimal.ZERO, 0L, 0L,
                BigDecimal.ZERO, Collections.emptyList(), Collections.emptyList());
        when(dashboardService.getFinanciero(12)).thenReturn(financiero);

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/financiero?months=12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estimateConversionRate").value(0));
    }

    @Test
    void givenData_whenGetProductividad_thenReturn200() throws Exception {
        // Arrange
        DashboardProductividadResponse productividad = new DashboardProductividadResponse(
                new BigDecimal("3.5"), Collections.emptyList(), Collections.emptyList());
        when(dashboardService.getProductividad()).thenReturn(productividad);

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/productividad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageRepairDays").value(3.5));
    }

    @Test
    void givenConfig_whenGetConfig_thenReturn200() throws Exception {
        // Arrange
        DashboardConfig config = DashboardConfig.builder().staleThresholdDays(5).build();
        config.setId(1L);
        when(dashboardService.getConfig()).thenReturn(config);

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.staleThresholdDays").value(5));
    }

    @Test
    void givenValidRequest_whenUpdateConfig_thenReturn200() throws Exception {
        // Arrange
        DashboardConfigRequest request = new DashboardConfigRequest(10);
        DashboardConfig config = DashboardConfig.builder().staleThresholdDays(10).build();
        config.setId(1L);
        when(dashboardService.updateConfig(any(DashboardConfigRequest.class))).thenReturn(config);

        // Act & Assert
        mockMvc.perform(put("/api/dashboard/config").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.staleThresholdDays").value(10));
    }

    @Test
    void givenInvalidThreshold_whenUpdateConfig_thenReturn400() throws Exception {
        // Arrange
        DashboardConfigRequest request = new DashboardConfigRequest(0);

        // Act & Assert
        mockMvc.perform(put("/api/dashboard/config").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenExcelData_whenExportFinanciero_thenReturnXlsx() throws Exception {
        // Arrange
        when(dashboardExportService.exportFinanciero(6)).thenReturn(new byte[]{1, 2, 3});

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/export/financiero"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=dashboard_financiero.xlsx"));
    }

    @Test
    void givenExcelData_whenExportProductividad_thenReturnXlsx() throws Exception {
        // Arrange
        when(dashboardExportService.exportProductividad()).thenReturn(new byte[]{1, 2, 3});

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/export/productividad"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=dashboard_productividad.xlsx"));
    }
}
