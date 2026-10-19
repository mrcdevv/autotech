package com.autotech.role.service;

import com.autotech.common.exception.ConflictException;
import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.permission.model.Permission;
import com.autotech.permission.repository.PermissionRepository;
import com.autotech.role.dto.RoleMapper;
import com.autotech.role.dto.RoleRequest;
import com.autotech.role.dto.RoleResponse;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private static final String ADMIN_ROLE_PROTECTED_MESSAGE =
            "El rol " + Role.ADMIN_ROLE_NAME + " es del sistema y no puede modificarse ni eliminarse";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAll() {
        log.debug("Fetching all roles");
        return roleMapper.toResponseList(roleRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse getById(Long id) {
        log.debug("Fetching role with id {}", id);
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol con ID " + id));
        return roleMapper.toResponse(role);
    }

    @Override
    @Transactional
    public RoleResponse create(RoleRequest request) {
        if (roleRepository.findByNameIgnoreCase(request.name()).isPresent()) {
            throw new DuplicateResourceException("Ya existe un rol con el nombre: " + request.name());
        }
        Role role = Role.builder()
                .name(request.name())
                .description(request.description())
                .build();
        role.setPermissions(resolvePermissions(request.permissionIds()));
        Role saved = roleRepository.save(role);
        log.info("Created role with id {}", saved.getId());
        return roleMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RoleResponse update(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol con ID " + id));
        if (isAdminRole(role)) {
            return updateAdminRole(role, request);
        }
        Optional<Role> existing = roleRepository.findByNameIgnoreCase(request.name());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new DuplicateResourceException("Ya existe un rol con el nombre: " + request.name());
        }
        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissions(resolvePermissions(request.permissionIds()));
        Role saved = roleRepository.save(role);
        log.info("Updated role with id {}", saved.getId());
        return roleMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol con ID " + id));
        if (isAdminRole(role)) {
            log.warn("Rejected deletion of system role {}", Role.ADMIN_ROLE_NAME);
            throw new ConflictException(ADMIN_ROLE_PROTECTED_MESSAGE);
        }
        roleRepository.delete(role);
        log.info("Deleted role with id {}", id);
    }

    /**
     * The system role only accepts description changes: its name and permission set are fixed.
     */
    private RoleResponse updateAdminRole(Role role, RoleRequest request) {
        Set<Long> currentPermissionIds = role.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
        Set<Long> requestedPermissionIds = request.permissionIds() == null ? Set.of() : request.permissionIds();
        boolean renamed = !Role.ADMIN_ROLE_NAME.equals(request.name());
        if (renamed || !currentPermissionIds.equals(requestedPermissionIds)) {
            log.warn("Rejected modification of system role {}", Role.ADMIN_ROLE_NAME);
            throw new ConflictException(ADMIN_ROLE_PROTECTED_MESSAGE);
        }
        role.setDescription(request.description());
        Role saved = roleRepository.save(role);
        log.info("Updated description of system role {}", Role.ADMIN_ROLE_NAME);
        return roleMapper.toResponse(saved);
    }

    private boolean isAdminRole(Role role) {
        return Role.ADMIN_ROLE_NAME.equals(role.getName());
    }

    private Set<Permission> resolvePermissions(Set<Long> permissionIds) {
        if (permissionIds == null || permissionIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            Set<Long> foundIds = permissions.stream()
                    .map(Permission::getId)
                    .collect(Collectors.toSet());
            List<Long> missingIds = permissionIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            throw new ResourceNotFoundException("No se encontró el permiso con ID " + missingIds.getFirst());
        }
        return new HashSet<>(permissions);
    }
}
