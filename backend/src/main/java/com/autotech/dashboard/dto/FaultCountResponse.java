package com.autotech.dashboard.dto;

public record FaultCountResponse(
        String faultName,
        Long count
) {}
