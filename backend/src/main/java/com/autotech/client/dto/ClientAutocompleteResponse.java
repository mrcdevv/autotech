package com.autotech.client.dto;

public record ClientAutocompleteResponse(
        Long id,
        String firstName,
        String lastName,
        String dni
) {}
