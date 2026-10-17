package com.autotech.notification.controller;

import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.notification.dto.NotificationConfigResponse;
import com.autotech.notification.dto.ReminderRunResponse;
import com.autotech.notification.service.NotificationConfigService;
import com.autotech.notification.service.ReminderService;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationConfigService notificationConfigService;

    @MockitoBean
    private ReminderService reminderService;

    @MockitoBean
    private EmailNotificationService emailNotificationService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private final NotificationConfigResponse config = new NotificationConfigResponse(
            true, true, true, 6, true, 7, true, 3, true, "0 0 9 * * *");

    @Test
    @WithMockUser(authorities = "read_order")
    void givenAnyEmployee_whenGetConfig_thenReturn200() throws Exception {
        when(notificationConfigService.getConfig()).thenReturn(config);

        mockMvc.perform(get("/api/notifications/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.serviceReminderMonths").value(6))
                .andExpect(jsonPath("$.data.mailEnabled").value(true));
    }

    @Test
    @WithMockUser(authorities = "manage_config")
    void givenAdmin_whenRunReminders_thenReturnCounts() throws Exception {
        when(reminderService.runReminders()).thenReturn(new ReminderRunResponse(2, 1, 0, 1));

        mockMvc.perform(post("/api/notifications/reminders/run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se enviaron 4 recordatorios"))
                .andExpect(jsonPath("$.data.appointmentReminders").value(2));
    }

    @Test
    @WithMockUser(authorities = "read_order")
    void givenNonAdmin_whenRunReminders_thenReturn403() throws Exception {
        mockMvc.perform(post("/api/notifications/reminders/run"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta acción"));

        verify(reminderService, never()).runReminders();
    }

    @Test
    @WithMockUser(authorities = "manage_config")
    void givenInvalidThreshold_whenUpdateConfig_thenReturn400() throws Exception {
        mockMvc.perform(put("/api/notifications/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"remindersEnabled":true,"appointmentReminderEnabled":true,"serviceReminderEnabled":true,
                                 "serviceReminderMonths":0,"balanceDueEnabled":true,"balanceDueDays":7,
                                 "pickupReminderEnabled":true,"pickupReminderDays":3}
                                """))
                .andExpect(status().isBadRequest());

        verify(notificationConfigService, never()).updateConfig(any());
    }

    @Test
    @WithMockUser(authorities = "manage_config")
    void givenSmtpFailure_whenSendTestEmail_thenReturn400WithReason() throws Exception {
        doThrow(new BusinessException("No se pudo enviar el email de prueba: Connection refused"))
                .when(emailNotificationService).sendTestEmail("yo@test.com");

        mockMvc.perform(post("/api/notifications/test-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"to\":\"yo@test.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No se pudo enviar el email de prueba: Connection refused"));
    }

    @Test
    void givenAnonymousUser_whenGetConfig_thenRejected() throws Exception {
        mockMvc.perform(get("/api/notifications/config"))
                .andExpect(status().is4xxClientError());
    }
}
