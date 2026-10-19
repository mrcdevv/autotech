package com.autotech.notification.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.email.service.EmailNotificationService;
import com.autotech.notification.dto.NotificationConfigRequest;
import com.autotech.notification.dto.NotificationConfigResponse;
import com.autotech.notification.dto.ReminderRunResponse;
import com.autotech.notification.dto.TestEmailRequest;
import com.autotech.notification.service.NotificationConfigService;
import com.autotech.notification.service.ReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationConfigService notificationConfigService;
    private final ReminderService reminderService;
    private final EmailNotificationService emailNotificationService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<NotificationConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(notificationConfigService.getConfig()));
    }

    @PutMapping("/config")
    @PreAuthorize("hasAuthority('manage_config')")
    public ResponseEntity<ApiResponse<NotificationConfigResponse>> updateConfig(
            @Valid @RequestBody NotificationConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Configuración de notificaciones guardada",
                notificationConfigService.updateConfig(request)));
    }

    @PostMapping("/reminders/run")
    @PreAuthorize("hasAuthority('manage_config')")
    public ResponseEntity<ApiResponse<ReminderRunResponse>> runReminders() {
        ReminderRunResponse result = reminderService.runReminders();
        String message = result.total() == 0
                ? "No había recordatorios pendientes para enviar"
                : "Se enviaron " + result.total() + " recordatorios";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    @PostMapping("/test-email")
    @PreAuthorize("hasAuthority('manage_config')")
    public ResponseEntity<ApiResponse<Void>> sendTestEmail(@Valid @RequestBody TestEmailRequest request) {
        emailNotificationService.sendTestEmail(request.to());
        return ResponseEntity.ok(ApiResponse.success("Email de prueba enviado a " + request.to(), null));
    }
}
