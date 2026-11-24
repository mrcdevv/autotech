package com.autotech.dashboard.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.dashboard.service.DashboardExportService;
import com.autotech.dashboard.service.ReportService;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import com.autotech.security.WithAllPermissions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReportService reportService;

    @MockitoBean
    private DashboardExportService dashboardExportService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithAllPermissions
    void givenPeriod_whenExportReports_thenReturnXlsxNamedAfterPeriod() throws Exception {
        // Arrange
        when(dashboardExportService.exportReports(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31)))
                .thenReturn(new byte[]{1, 2, 3});

        // Act & Assert
        mockMvc.perform(get("/api/dashboard/reports/export")
                        .param("from", "2026-01-01")
                        .param("to", "2026-12-31"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=reportes_2026-01-01_2026-12-31.xlsx"));
    }

    @Test
    @WithMockUser(authorities = {"read_order", "read_delivery_note"})
    void givenUserWithoutViewReports_whenExportReports_thenReturn403() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/dashboard/reports/export")
                        .param("from", "2026-01-01")
                        .param("to", "2026-12-31"))
                .andExpect(status().isForbidden());
    }
}
