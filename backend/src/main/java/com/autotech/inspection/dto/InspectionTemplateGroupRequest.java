package com.autotech.inspection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record InspectionTemplateGroupRequest(

        Long id,

        @NotBlank(message = "El título del grupo es obligatorio")
        @Size(max = 255, message = "El título del grupo no debe superar los 255 caracteres")
        String title,

        @NotNull(message = "El orden es obligatorio")
        Integer sortOrder,

        @NotEmpty(message = "El grupo debe tener al menos un ítem")
        @Valid
        List<InspectionTemplateItemRequest> items
) {}
