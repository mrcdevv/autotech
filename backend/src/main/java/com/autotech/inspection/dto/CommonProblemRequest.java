package com.autotech.inspection.dto;

import jakarta.validation.constraints.NotBlank;

public record CommonProblemRequest(

        @NotBlank(message = "La descripción del problema es obligatoria")
        String description
) {}
