package com.autotech.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InspectionTemplateItemRequest(

        Long id,

        @NotBlank(message = "El nombre del ítem es obligatorio")
        @Size(max = 255, message = "El nombre del ítem no debe superar los 255 caracteres")
        String name,

        @NotNull(message = "El orden es obligatorio")
        Integer sortOrder
) {}
