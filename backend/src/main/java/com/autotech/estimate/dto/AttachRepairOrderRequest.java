package com.autotech.estimate.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for attaching an existing estimate to a repair order (T5a).
 * A deliberate association endpoint, kept separate from the general update path.
 */
public record AttachRepairOrderRequest(
        @NotNull(message = "La orden de trabajo es obligatoria")
        Long repairOrderId
) {}
