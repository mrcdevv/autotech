package com.autotech.dashboard.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DashboardConfigRequest(
        @NotNull @Min(1) @Max(90) Integer staleThresholdDays
) {}
