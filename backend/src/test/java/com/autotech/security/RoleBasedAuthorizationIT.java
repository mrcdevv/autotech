package com.autotech.security;

import com.autotech.employee.model.Employee;
import com.autotech.employee.model.EmployeeStatus;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.role.model.Role;
import com.autotech.role.repository.RoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authorization checks through the real filter chain: JWT → CustomUserDetailsService
 * (permissions from role_permissions) → @PreAuthorize. Uses the seeded V1/V11 roles and permissions.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class RoleBasedAuthorizationIT {

    private static final String PASSWORD = "Test-Password-1";
    private static final String UNKNOWN_ID = "999999";

    // @Valid bodies are validated before @PreAuthorize runs, so write calls need a valid
    // body for a denial to surface as 403 instead of 400.
    private static final Map<String, String> VALID_BODIES = Map.of(
            "/api/tax-config", "{\"taxPercentage\": 21}");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        for (TestUser user : TestUser.values()) {
            upsertEmployee(user);
        }
    }

    // ---------------------------------------------------------------------
    // Privilege escalation regression
    // ---------------------------------------------------------------------

    @Test
    void givenMecanico_whenAssignAdministradorRoleToHimself_thenReturn403AndRolesUnchanged() throws Exception {
        // Arrange
        Employee mecanico = employee(TestUser.MECANICO);
        Long adminRoleId = role("ADMINISTRADOR").getId();

        // Act & Assert
        mockMvc.perform(put("/api/employees/" + mecanico.getId() + "/roles")
                        .header("Authorization", bearer(TestUser.MECANICO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(adminRoleId))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta acción"));

        assertThat(employeeRepository.findWithRolesById(mecanico.getId()).orElseThrow().getRoles())
                .extracting(Role::getName)
                .containsExactly("MECANICO");
    }

    @Test
    void givenAdministrador_whenAssignRoles_thenReturn200() throws Exception {
        // Arrange
        Employee mecanico = employee(TestUser.MECANICO);
        Long mecanicoRoleId = role("MECANICO").getId();

        // Act & Assert
        mockMvc.perform(put("/api/employees/" + mecanico.getId() + "/roles")
                        .header("Authorization", bearer(TestUser.ADMINISTRADOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(mecanicoRoleId))))
                .andExpect(status().isOk());
    }

    @Test
    void givenJefeTaller_whenCreateRole_thenReturn403() throws Exception {
        // Arrange
        Map<String, Object> body = Map.of("name", "ROL_PRUEBA", "description", "Prueba");

        // Act & Assert
        mockMvc.perform(post("/api/roles")
                        .header("Authorization", bearer(TestUser.JEFE_TALLER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());

        assertThat(roleRepository.findByName("ROL_PRUEBA")).isEmpty();
    }

    // ---------------------------------------------------------------------
    // Permission matrix samples
    // ---------------------------------------------------------------------

    static Stream<Arguments> matrix() {
        return Stream.of(
                // MECANICO
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/clients", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/clients/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/employees", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/employees/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/repair-orders", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/repair-orders/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/estimates", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/estimates/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/delivery-notes", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/delivery-notes/" + UNKNOWN_ID + "/payments", false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/appointments", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/appointments/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/roles", false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/permissions", false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/tax-config", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.PUT, "/api/tax-config", false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/products", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.DELETE, "/api/products/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, "/api/dashboard/summary", true),
                Arguments.of(TestUser.MECANICO, HttpMethod.GET, reportsUrl(), false),
                // RECEPCIONISTA
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/clients/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/vehicles/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/employees/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/repair-orders/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.GET, "/api/repair-orders/" + UNKNOWN_ID + "/inspections", true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/repair-orders/" + UNKNOWN_ID + "/inspections/1", false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/estimates/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/delivery-notes/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.GET, "/api/delivery-notes/" + UNKNOWN_ID + "/payments", true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/delivery-notes/" + UNKNOWN_ID + "/payments/1", true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/appointments/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.DELETE, "/api/services/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.RECEPCIONISTA, HttpMethod.GET, reportsUrl(), false),
                // JEFE_TALLER
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.GET, "/api/employees", true),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.DELETE, "/api/employees/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.PUT, "/api/employees/" + UNKNOWN_ID + "/reset-password", false),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.DELETE, "/api/repair-orders/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.DELETE, "/api/services/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.DELETE, "/api/products/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.DELETE, "/api/tags/" + UNKNOWN_ID, false),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.GET, "/api/roles", false),
                Arguments.of(TestUser.JEFE_TALLER, HttpMethod.GET, reportsUrl(), false),
                // ADMINISTRADOR
                Arguments.of(TestUser.ADMINISTRADOR, HttpMethod.GET, "/api/roles", true),
                Arguments.of(TestUser.ADMINISTRADOR, HttpMethod.GET, "/api/permissions", true),
                Arguments.of(TestUser.ADMINISTRADOR, HttpMethod.DELETE, "/api/employees/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.ADMINISTRADOR, HttpMethod.DELETE, "/api/tags/" + UNKNOWN_ID, true),
                Arguments.of(TestUser.ADMINISTRADOR, HttpMethod.GET, reportsUrl(), true)
        );
    }

    @ParameterizedTest(name = "{0} {1} {2} -> allowed={3}")
    @MethodSource("matrix")
    void givenRole_whenCallEndpoint_thenAuthorizationMatchesMatrix(
            TestUser user, HttpMethod method, String url, boolean allowed) throws Exception {
        // Arrange
        MockHttpServletRequestBuilder requestBuilder = request(method, url)
                .header("Authorization", bearer(user));
        if (method == HttpMethod.PUT || method == HttpMethod.POST) {
            requestBuilder.contentType(MediaType.APPLICATION_JSON).content(VALID_BODIES.getOrDefault(url, "{}"));
        }

        // Act
        MvcResult result = mockMvc.perform(requestBuilder).andReturn();

        // Assert
        int statusCode = result.getResponse().getStatus();
        if (allowed) {
            assertThat(statusCode).as("status for allowed call").isNotIn(401, 403);
        } else {
            assertThat(statusCode).as("status for denied call").isEqualTo(403);
        }
    }

    // ---------------------------------------------------------------------
    // Authentication edge cases
    // ---------------------------------------------------------------------

    @Test
    void givenNoToken_whenCallProtectedEndpoint_thenReturn401Json() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("No autenticado. Inicie sesión para continuar"));
    }

    @Test
    void givenNoToken_whenChangePassword_thenReturn401() throws Exception {
        Map<String, String> body = Map.of("currentPassword", PASSWORD, "newPassword", "Otra-clave-1");

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    void givenInactiveEmployee_whenLogin_thenReturn401() throws Exception {
        mockMvc.perform(login(TestUser.INACTIVO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales inválidas"));
    }

    @Test
    void givenInactiveEmployeeToken_whenCallEndpoint_thenReturn401() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary").header("Authorization", bearer(TestUser.INACTIVO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void givenUnknownUrl_whenCallAuthenticated_thenReturn404() throws Exception {
        mockMvc.perform(get("/api/does-not-exist").header("Authorization", bearer(TestUser.ADMINISTRADOR)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    void givenMustChangePassword_whenCallBusinessEndpoint_thenReturn403PasswordChangeRequired() throws Exception {
        mockMvc.perform(get("/api/clients").header("Authorization", bearer(TestUser.MUST_CHANGE)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("PASSWORD_CHANGE_REQUIRED"));
    }

    @Test
    void givenMustChangePassword_whenCallMe_thenReturn200() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(TestUser.MUST_CHANGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mustChangePassword").value(true));
    }

    @Test
    void givenMustChangePassword_whenChangePassword_thenBusinessEndpointsBecomeAvailable() throws Exception {
        // Arrange
        Map<String, String> body = Map.of("currentPassword", PASSWORD, "newPassword", "Otra-clave-1");

        // Act
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", bearer(TestUser.MUST_CHANGE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        // Assert
        mockMvc.perform(get("/api/clients").header("Authorization", bearer(TestUser.MUST_CHANGE)))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------------
    // Login and /me payload
    // ---------------------------------------------------------------------

    @Test
    void givenValidCredentials_whenLogin_thenResponseIncludesRolesAndPermissions() throws Exception {
        mockMvc.perform(login(TestUser.MECANICO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.roles").value(hasItem("MECANICO")))
                .andExpect(jsonPath("$.permissions").value(hasItem("read_order")))
                .andExpect(jsonPath("$.permissions").value(not(hasItem("create_client"))));
    }

    @Test
    void givenAdministrador_whenGetMe_thenPermissionsIncludeManageRoles() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(TestUser.ADMINISTRADOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles").value(hasItem("ADMINISTRADOR")))
                .andExpect(jsonPath("$.data.permissions").value(hasItem("manage_roles")));
    }

    @Test
    void givenJefeTaller_whenGetMe_thenPermissionsExcludeAdminOnlyCodes() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(TestUser.JEFE_TALLER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissions").value(hasItem("delete_order")))
                .andExpect(jsonPath("$.data.permissions").value(not(hasItem("manage_roles"))))
                .andExpect(jsonPath("$.data.permissions").value(not(hasItem("view_reports"))))
                .andExpect(jsonPath("$.data.permissions").value(not(hasItem("create_employee"))));
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    enum TestUser {
        ADMINISTRADOR("ADMINISTRADOR", "it-admin@autotech.test", "90000001", EmployeeStatus.ACTIVO, false),
        JEFE_TALLER("JEFE_TALLER", "it-jefe@autotech.test", "90000002", EmployeeStatus.ACTIVO, false),
        MECANICO("MECANICO", "it-mecanico@autotech.test", "90000003", EmployeeStatus.ACTIVO, false),
        RECEPCIONISTA("RECEPCIONISTA", "it-recepcion@autotech.test", "90000004", EmployeeStatus.ACTIVO, false),
        INACTIVO("ADMINISTRADOR", "it-inactivo@autotech.test", "90000005", EmployeeStatus.INACTIVO, false),
        MUST_CHANGE("MECANICO", "it-cambio@autotech.test", "90000006", EmployeeStatus.ACTIVO, true);

        private final String roleName;
        private final String email;
        private final String dni;
        private final EmployeeStatus status;
        private final boolean mustChangePassword;

        TestUser(String roleName, String email, String dni, EmployeeStatus status, boolean mustChangePassword) {
            this.roleName = roleName;
            this.email = email;
            this.dni = dni;
            this.status = status;
            this.mustChangePassword = mustChangePassword;
        }
    }

    private static String reportsUrl() {
        return "/api/dashboard/reports/summary?from=2026-01-01&to=2026-12-31";
    }

    private void upsertEmployee(TestUser user) {
        Employee employee = employeeRepository.findByEmail(user.email)
                .orElseGet(() -> Employee.builder()
                        .firstName("IT")
                        .lastName(user.name())
                        .dni(user.dni)
                        .email(user.email)
                        .phone("3510000000")
                        .build());
        employee.setPassword(passwordEncoder.encode(PASSWORD));
        employee.setStatus(user.status);
        employee.setMustChangePassword(user.mustChangePassword);
        employee.setRoles(new HashSet<>(List.of(role(user.roleName))));
        employeeRepository.save(employee);
    }

    private Employee employee(TestUser user) {
        return employeeRepository.findByEmail(user.email).orElseThrow();
    }

    private Role role(String name) {
        return roleRepository.findByName(name).orElseThrow();
    }

    private String bearer(TestUser user) {
        return "Bearer " + jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(user.email, null));
    }

    private MockHttpServletRequestBuilder login(TestUser user) throws Exception {
        return post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", user.email, "password", PASSWORD)));
    }
}
