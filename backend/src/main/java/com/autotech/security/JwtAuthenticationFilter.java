package com.autotech.security;

import com.autotech.common.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    static final String PASSWORD_CHANGE_REQUIRED_CODE = "PASSWORD_CHANGE_REQUIRED";
    static final String PASSWORD_CHANGE_REQUIRED_MESSAGE = "Debe cambiar su contraseña antes de continuar";

    private static final String AUTH_PATH_PREFIX = "/api/auth/";

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getJwtFromRequest(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            AuthenticatedEmployee employee = loadEmployee(tokenProvider.getUsernameFromJWT(token));

            // Deleted or deactivated employees keep a valid token until it expires;
            // leave them unauthenticated so the entry point answers 401.
            if (employee != null && employee.isEnabled()) {
                if (employee.isMustChangePassword() && !isAuthEndpoint(request)) {
                    writePasswordChangeRequired(response);
                    return;
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        employee, null, employee.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private AuthenticatedEmployee loadEmployee(String email) {
        try {
            return customUserDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException ex) {
            return null;
        }
    }

    private boolean isAuthEndpoint(HttpServletRequest request) {
        return request.getRequestURI().startsWith(request.getContextPath() + AUTH_PATH_PREFIX);
    }

    private void writePasswordChangeRequired(HttpServletResponse response) throws IOException {
        ApiResponse<Map<String, String>> body = new ApiResponse<>(
                "error", PASSWORD_CHANGE_REQUIRED_MESSAGE, Map.of("code", PASSWORD_CHANGE_REQUIRED_CODE));
        SecurityErrorResponseWriter.write(response, objectMapper, HttpStatus.FORBIDDEN, body);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
