package com.autotech.security;

import com.autotech.common.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;

/** Returns 401 as an {@link ApiResponse} JSON body instead of an empty response. */
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    static final String MESSAGE = "No autenticado. Inicie sesión para continuar";

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        SecurityErrorResponseWriter.write(response, objectMapper, HttpStatus.UNAUTHORIZED, ApiResponse.error(MESSAGE));
    }
}
