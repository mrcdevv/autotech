package com.autotech.notification.dto;

public record PublicUnsubscribeResponse(
        String clientFirstName,
        boolean optedOut
) {}
