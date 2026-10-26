package com.autotech.auth.dto;

import java.util.List;

public record CurrentUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean mustChangePassword,
        List<String> roles,
        List<String> permissions
) {}
