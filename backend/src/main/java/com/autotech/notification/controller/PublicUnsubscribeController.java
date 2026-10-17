package com.autotech.notification.controller;

import com.autotech.common.dto.ApiResponse;
import com.autotech.notification.dto.PublicUnsubscribeResponse;
import com.autotech.notification.service.UnsubscribeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unsubscribe link included in reminder emails. No authentication: the token is the credential.
 */
@RestController
@RequestMapping("/api/public/unsubscribe")
@RequiredArgsConstructor
public class PublicUnsubscribeController {

    private final UnsubscribeService unsubscribeService;

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<PublicUnsubscribeResponse>> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(unsubscribeService.getByToken(token)));
    }

    @PostMapping("/{token}")
    public ResponseEntity<ApiResponse<PublicUnsubscribeResponse>> unsubscribe(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success("Listo, ya no vas a recibir recordatorios por email",
                unsubscribeService.unsubscribe(token)));
    }
}
