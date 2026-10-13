package com.autotech.role.service;

import com.autotech.common.exception.DuplicateResourceException;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.permission.dto.PermissionResponse;
import com.autotech.permission.model.Permission;
import com.autotech.permission.repository.PermissionRepository;
import com.autotech.role.dto.RoleMapper;
import com.autotech.role.dto.RoleRequest;
import com.autotech.role.dto.RoleResponse;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RoleMapper roleMapper;

    @InjectMocks
    private RoleServiceImpl roleService;

    @Test
    void givenRolesExist_whenGetAll_thenReturnList() {
        Role role = buildRole(1L, "JEFE_TALLER", "Descripción");
        RoleResponse response = buildRoleResponse(1L, "JEFE_TALLER");
        when(roleRepository.findAll()).thenReturn(List.of(role));
        when(roleMapper.toResponseList(List.of(role))).thenReturn(List.of(response));

        List<RoleResponse> result = roleService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("JEFE_TALLER");
    }

    @Test
    void givenValidId_whenGetById_thenReturnRoleResponse() {
        Role role = buildRole(1L, "JEFE_TALLER", "Descripción");
        RoleResponse response = buildRoleResponse(1L, "JEFE_TALLER");
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(roleMapper.toResponse(role)).thenReturn(response);

        RoleResponse result = roleService.getById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("JEFE_TALLER");
    }

    @Test
    void givenValidRequest_whenCreate_thenReturnRoleResponse() {
        RoleRequest request = new RoleRequest("JEFE_TALLER", "Descripción", Set.of(1L, 2L));
        Permission readClient = buildPermission(1L, "read_client", "Ver clientes");
        Permission createClient = buildPermission(2L, "create_client", "Crear clientes");
        Role saved = buildRole(1L, "JEFE_TALLER", "Descripción");
        RoleResponse response = buildRoleResponse(1L, "JEFE_TALLER");

        when(roleRepository.findByName("JEFE_TALLER")).thenReturn(Optional.empty());
        when(permissionRepository.findAllById(any())).thenReturn(List.of(readClient, createClient));
        when(roleRepository.save(any(Role.class))).thenReturn(saved);
        when(roleMapper.toResponse(saved)).thenReturn(response);

        RoleResponse result = roleService.create(request);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("JEFE_TALLER");
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    void givenDuplicateName_whenCreate_thenThrowDuplicateResourceException() {
        RoleRequest request = new RoleRequest("EXISTENTE", null, Set.of());
        when(roleRepository.findByName("EXISTENTE")).thenReturn(Optional.of(buildRole(1L, "EXISTENTE", null)));

        assertThatThrownBy(() -> roleService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("EXISTENTE");
    }

    @Test
    void givenNonExistentPermissionId_whenCreate_thenThrowResourceNotFoundException() {
        RoleRequest request = new RoleRequest("NUEVO", null, Set.of(99L));
        when(roleRepository.findByName("NUEVO")).thenReturn(Optional.empty());
        when(permissionRepository.findAllById(any())).thenReturn(List.of());

        assertThatThrownBy(() -> roleService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturnUpdatedResponse() {
        RoleRequest request = new RoleRequest("NUEVO", "Descripción", Set.of(3L));
        Permission updateClient = buildPermission(3L, "update_client", "Actualizar clientes");
        Role existing = buildRole(1L, "VIEJO", "Descripción");
        RoleResponse response = buildRoleResponse(1L, "NUEVO");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(roleRepository.findByName("NUEVO")).thenReturn(Optional.empty());
        when(permissionRepository.findAllById(any())).thenReturn(List.of(updateClient));
        when(roleRepository.save(existing)).thenReturn(existing);
        when(roleMapper.toResponse(existing)).thenReturn(response);

        RoleResponse result = roleService.update(1L, request);

        assertThat(result.name()).isEqualTo("NUEVO");
        assertThat(existing.getPermissions()).containsExactly(updateClient);
        verify(roleRepository).save(existing);
    }

    @Test
    void givenDuplicateName_whenUpdate_thenThrowDuplicateResourceException() {
        RoleRequest request = new RoleRequest("EXISTENTE", null, Set.of());
        Role existing = buildRole(1L, "VIEJO", null);
        Role other = buildRole(2L, "EXISTENTE", null);

        when(roleRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(roleRepository.findByName("EXISTENTE")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> roleService.update(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("EXISTENTE");
    }

    @Test
    void givenExistingId_whenDelete_thenDeletesSuccessfully() {
        when(roleRepository.existsById(1L)).thenReturn(true);

        roleService.delete(1L);

        verify(roleRepository).deleteById(1L);
    }

    @Test
    void givenNonExistentId_whenDelete_thenThrowResourceNotFoundException() {
        when(roleRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> roleService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // --- Helpers ---

    private Role buildRole(Long id, String name, String description) {
        Role role = Role.builder().name(name).description(description).build();
        if (id != null) role.setId(id);
        return role;
    }

    private Permission buildPermission(Long id, String code, String description) {
        Permission permission = Permission.builder().code(code).description(description).build();
        if (id != null) permission.setId(id);
        return permission;
    }

    private RoleResponse buildRoleResponse(Long id, String name) {
        return new RoleResponse(
                id,
                name,
                "Descripción",
                Set.of(new PermissionResponse(1L, "read_client", "Ver clientes")),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }
}
