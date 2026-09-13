package com.autotech.inspection.dto;

import com.autotech.inspection.model.InspectionItemStatus;
import jakarta.validation.constraints.NotNull;

public record InspectionItemRequest(

        @NotNull(message = "El ID del ítem es obligatorio")
        Long id,

        @NotNull(message = "El estado del ítem es obligatorio")
        InspectionItemStatus status,

        String comment
) {}
