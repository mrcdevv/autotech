package com.autotech.inspection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SaveInspectionItemsRequest(

        @NotEmpty(message = "Debe incluir al menos un ítem")
        @Valid
        List<InspectionItemRequest> items
) {}
