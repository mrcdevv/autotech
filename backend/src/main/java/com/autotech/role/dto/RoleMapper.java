package com.autotech.role.dto;

import com.autotech.permission.dto.PermissionResponse;
import com.autotech.permission.model.Permission;
import com.autotech.role.model.Role;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RoleMapper {

    public RoleResponse toResponse(Role entity) {
        if (entity == null) return null;
        Set<PermissionResponse> permissions = entity.getPermissions() == null
                ? Set.of()
                : entity.getPermissions().stream()
                        .map(this::toPermissionResponse)
                        .collect(Collectors.toSet());
        return new RoleResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                permissions,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public List<RoleResponse> toResponseList(List<Role> entities) {
        if (entities == null) return null;
        return entities.stream().map(this::toResponse).toList();
    }

    private PermissionResponse toPermissionResponse(Permission permission) {
        if (permission == null) return null;
        return new PermissionResponse(permission.getId(), permission.getCode(), permission.getDescription());
    }
}
