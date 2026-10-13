package com.autotech.role.dto;

import com.autotech.permission.dto.PermissionResponse;

import java.time.LocalDateTime;
import java.util.Set;

public record RoleResponse(
        Long id,
        String name,
        String description,
        Set<PermissionResponse> permissions,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Compatibility constructor used by the employee module, which embeds a
     * compact role representation (id, name, description) without permissions.
     */
    public RoleResponse(Long id, String name, String description) {
        this(id, name, description, Set.of(), null, null);
    }
}
