package com.autotech.auth.controller;

import com.autotech.auth.service.AuthService;
import com.autotech.common.exception.BusinessException;
import com.autotech.common.exception.GlobalExceptionHandler;
import com.autotech.employee.repository.EmployeeRepository;
import com.autotech.security.CustomUserDetailsService;
import com.autotech.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private EmployeeRepository employeeRepository;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void givenAnyEmail_whenRequestPasswordRecovery_thenReturnGenericSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/password-recovery").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nadie@taller.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(authService).requestPasswordRecovery("nadie@taller.com");
    }

    @Test
    void givenValidRequest_whenResetPassword_thenReturn200() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"abc\",\"newPassword\":\"nueva123\"}"))
                .andExpect(status().isOk());

        verify(authService).resetPassword("abc", "nueva123");
    }

    @Test
    void givenShortPassword_whenResetPassword_thenReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"abc\",\"newPassword\":\"123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void givenInvalidToken_whenResetPassword_thenReturn400WithMessage() throws Exception {
        doThrow(new BusinessException("El enlace para restablecer la contraseña es inválido o venció."))
                .when(authService).resetPassword("bad", "nueva123");

        mockMvc.perform(post("/api/auth/password-reset").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"bad\",\"newPassword\":\"nueva123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El enlace para restablecer la contraseña es inválido o venció."));
    }
}
