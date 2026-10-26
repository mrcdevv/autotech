package com.autotech.deliverynote.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for attaching an existing delivery note to a repair order.
 * A deliberate, one-way and one-time association: there is no unlink and
 * re-attaching is refused, so the endpoint lives apart from any update path.
 */
public record AttachRepairOrderRequest(
        @NotNull(message = "La orden de trabajo es obligatoria")
        Long repairOrderId
) {}
