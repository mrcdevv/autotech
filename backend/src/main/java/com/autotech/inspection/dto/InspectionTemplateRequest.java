package com.autotech.inspection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record InspectionTemplateRequest(

        @NotBlank(message = "El título de la plantilla es obligatorio")
        @Size(max = 255, message = "El título no debe superar los 255 caracteres")
        String title,

        @NotEmpty(message = "La plantilla debe tener al menos un grupo")
        @Valid
        List<InspectionTemplateGroupRequest> groups
) {}
