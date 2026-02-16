package com.autotech.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CannedJobRequest(
        @NotBlank(message = "El título del trabajo enlatado es obligatorio")
        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        String title,

        @Size(max = 5000, message = "La descripción no puede superar los 5000 caracteres")
        String description,

        @Valid
        List<CannedJobServiceRequest> services,

        @Valid
        List<CannedJobProductRequest> products
) {}
