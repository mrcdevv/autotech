package com.autotech.client.dto;

public record ClientAutocompleteResponse(
        Long id,
        String firstName,
        String lastName,
        String dni,
        String phone,
        String email,
        String clientType
) {}
