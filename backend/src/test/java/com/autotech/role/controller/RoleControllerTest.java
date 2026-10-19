package com.autotech.role.controller;

import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.common.exception.ResourceNotFoundException;
import com.autotech.permission.dto.PermissionResponse;
import com.autotech.role.dto.RoleRequest;
import com.autotech.role.dto.RoleResponse;
import com.autotech.role.service.RoleService;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import com.autotech.security.SecurityConfig;
import com.autotech.security.WithAllPermissions;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoleController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@WithAllPermissions
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RoleService roleService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private final RoleResponse sampleResponse = new RoleResponse(
            1L,
            "JEFE_TALLER",
            "Descripción",
            Set.of(new PermissionResponse(1L, "read_client", "Ver clientes")),
            LocalDateTime.now(),
            LocalDateTime.now());

    @Test
    @WithMockUser(authorities = {"read_employee", "update_employee"})
    void givenUserWithoutManageRoles_whenCreateRole_thenReturn403() throws Exception {
        RoleRequest request = new RoleRequest("ROL_NUEVO", "Descripción", Set.of(1L));

        mockMvc.perform(post("/api/roles")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta acción"));

        verifyNoInteractions(roleService);
    }

    @Test
    @WithAnonymousUser
    void givenAnonymousUser_whenGetAll_thenReturn401() throws Exception {
        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("No autenticado. Inicie sesión para continuar"));

        verifyNoInteractions(roleService);
    }

    @Test
    void givenRolesExist_whenGetAll_thenReturn200() throws Exception {
        when(roleService.getAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("JEFE_TALLER"));
    }

    @Test
    void givenValidId_whenGetById_thenReturn200() throws Exception {
        when(roleService.getById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/roles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void givenNonExistentId_whenGetById_thenReturn404() throws Exception {
        when(roleService.getById(99L))
                .thenThrow(new ResourceNotFoundException("No se encontró el rol con ID 99"));

        mockMvc.perform(get("/api/roles/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void givenValidRequest_whenCreate_thenReturn201() throws Exception {
        RoleRequest request = new RoleRequest("JEFE_TALLER", "Descripción", Set.of(1L, 2L));
        when(roleService.create(any(RoleRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/roles")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Rol creado"));
    }

    @Test
    void givenValidRequest_whenUpdate_thenReturn200() throws Exception {
        RoleRequest request = new RoleRequest("JEFE_TALLER", "Descripción", Set.of(1L, 2L));
        when(roleService.update(eq(1L), any(RoleRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/roles/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Rol actualizado"));
    }

    @Test
    void givenExistingId_whenDelete_thenReturn200() throws Exception {
        doNothing().when(roleService).delete(1L);

        mockMvc.perform(delete("/api/roles/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Rol eliminado"));
    }

    @Test
    void givenNonExistentId_whenDelete_thenReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("No se encontró el rol con ID 99")).when(roleService).delete(99L);

        mockMvc.perform(delete("/api/roles/99").with(csrf()))
                .andExpect(status().isNotFound());
    }
}
