package com.autotech.security;

import com.autotech.common.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;

/** Returns 403 as an {@link ApiResponse} JSON body for denials raised in the filter chain. */
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    public static final String MESSAGE = "No tiene permisos para realizar esta acción";

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        SecurityErrorResponseWriter.write(response, objectMapper, HttpStatus.FORBIDDEN, ApiResponse.error(MESSAGE));
    }
}
